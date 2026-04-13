import express from "express"
import path from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Tiny .env loader so we don't need dotenv as a dependency.
const envFile = path.resolve(__dirname, "..", ".env")
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["'](.*)["']$/, "$1")
  }
}

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(express.json({ limit: "1mb" }))

// ─────────────────────────────────────────────────────────────
// POST /api/gitlab — server-side GitLab fetch (no browser CORS)
// Body: { url: string, token?: string }
// Returns: { project, tree, packageJson, requirementsTxt, readme }
// ─────────────────────────────────────────────────────────────
app.post("/api/gitlab", async (req, res) => {
  const { url, token } = req.body || {}
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing 'url' in request body" })
  }

  const cleaned = url
    .replace(/\/-\/.*$/, "")
    .replace(/\/(tree|blob)\/.*$/, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/, "")
  const match = cleaned.match(/^https?:\/\/(gitlab\.[^/]+)\/(.+)$/)
  if (!match) {
    return res.status(400).json({
      error: "Could not parse GitLab URL. Expected: https://gitlab.lnu.se/1dv027/student/username/project",
    })
  }
  const [, host, projectPath] = match
  const encodedPath = encodeURIComponent(projectPath)
  const base = `https://${host}/api/v4`

  const headers = { "User-Agent": "ai-engineering-demo" }
  const effectiveToken = token || process.env.GITLAB_TOKEN
  if (effectiveToken) headers["PRIVATE-TOKEN"] = effectiveToken

  try {
    const projRes = await fetch(`${base}/projects/${encodedPath}`, { headers })
    if (projRes.status === 401 || projRes.status === 403) {
      return res.status(projRes.status).json({
        error: "Access denied. The repo is private — provide a GitLab Personal Access Token with 'read_api' scope.",
      })
    }
    if (projRes.status === 404) {
      return res.status(404).json({
        error: "Project not found. Check the URL and make sure the token has access to this project.",
      })
    }
    if (!projRes.ok) {
      return res.status(projRes.status).json({ error: `GitLab API error (${projRes.status})` })
    }
    const project = await projRes.json()
    const branch = project.default_branch || "main"

    const treeRes = await fetch(
      `${base}/projects/${project.id}/repository/tree?per_page=100&recursive=true&ref=${branch}`,
      { headers }
    )
    const tree = treeRes.ok ? await treeRes.json() : []

    const fetchRawFile = async (entry) => {
      if (!entry) return null
      const r = await fetch(
        `${base}/projects/${project.id}/repository/files/${encodeURIComponent(entry.path)}/raw?ref=${branch}`,
        { headers }
      )
      return r.ok ? await r.text() : null
    }

    const pkgEntry = tree.find((f) => f.name === "package.json" && f.path.split("/").length <= 2)
    const reqEntry = tree.find((f) => f.name === "requirements.txt" && f.path.split("/").length <= 2)
    const readmeEntry = tree.find((f) => f.name.toLowerCase().startsWith("readme"))

    const [pkgText, requirementsTxt, readme] = await Promise.all([
      fetchRawFile(pkgEntry),
      fetchRawFile(reqEntry),
      fetchRawFile(readmeEntry),
    ])

    let packageJson = null
    if (pkgText) {
      try { packageJson = JSON.parse(pkgText) } catch { /* ignore malformed JSON */ }
    }

    res.json({ project, tree, packageJson, requirementsTxt, readme })
  } catch (e) {
    res.status(502).json({ error: `Failed to reach GitLab: ${e.message}` })
  }
})

// ─────────────────────────────────────────────────────────────
// POST /api/chat — streaming proxy to OpenAI chat completions
// Body: { messages: Array, apiKey?: string }
// Prefers OPENAI_API_KEY from env; falls back to apiKey in body.
// Streams SSE back to the client unchanged.
// ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, apiKey } = req.body || {}
  const key = process.env.OPENAI_API_KEY || apiKey
  if (!key) {
    return res.status(400).json({
      error: "No OpenAI API key available. Set OPENAI_API_KEY on the server or pass apiKey in the request body.",
    })
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing 'messages' array in request body" })
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, stream: true }),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "")
      let parsed = null
      try { parsed = JSON.parse(errText) } catch { /* not JSON */ }
      return res.status(upstream.status || 502).json({
        error: parsed?.error?.message || errText || `OpenAI request failed (${upstream.status})`,
      })
    }

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    req.on("close", () => reader.cancel().catch(() => {}))

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
    res.end()
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: `Chat proxy error: ${e.message}` })
    else res.end()
  }
})

// Tell the client whether a server-side OpenAI key is available, so the UI
// can skip prompting the user for one.
app.get("/api/config", (_req, res) => {
  res.json({ hasServerKey: Boolean(process.env.OPENAI_API_KEY) })
})

// ─────────────────────────────────────────────────────────────
// Serve the built Vite frontend in production
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "..", "dist")
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")))
  } else {
    console.warn(`[warn] dist/ not found at ${distPath}. Run 'npm run build' first.`)
  }
}

app.listen(PORT, () => {
  const mode = process.env.NODE_ENV === "production" ? "production" : "development"
  console.log(`[ai-demo] server listening on http://localhost:${PORT}  (${mode})`)
  if (mode !== "production") {
    console.log(`[ai-demo] run Vite at http://localhost:5173 — it proxies /api to this server`)
  }
  console.log(`[ai-demo] OpenAI key from env: ${process.env.OPENAI_API_KEY ? "yes" : "no"}`)
})
