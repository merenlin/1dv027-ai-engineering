# AI Engineering Demo — 1DV027

Interactive 5-tab demo used in the AI Engineering lecture: embeddings, semantic search, vector space, RAG pipeline, and a GitLab-connected planner for the VG feature.

This is a small full-stack app:

- **Frontend**: Vite + React, Tailwind via CDN
- **Backend**: Express, exposing `/api/gitlab` (server-side GitLab fetch, no CORS) and `/api/chat` (streaming OpenAI proxy so the API key can stay on the server)

## Run locally

```bash
npm install

# Dev: Vite on :5173, Express on :3000, Vite proxies /api to Express
npm run dev

# Prod: build the frontend, then serve everything from Express on :3000
npm run build
npm start
```

Open http://localhost:5173 in dev, or http://localhost:3000 in prod.

## Configuration

Copy `.env.example` to `.env` if you want to keep the OpenAI key off the client:

```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY=sk-...
```

If `OPENAI_API_KEY` is set on the server, the header "Add OpenAI Key" button is unnecessary — students can just use the chat. Otherwise the existing "paste your key in the header" UX still works and the key is forwarded per-request.

## Endpoints

- `POST /api/gitlab` — body: `{ url, token? }` — fetches project, tree, `package.json`, `requirements.txt`, and README from gitlab.lnu.se (or any GitLab host) and returns them as JSON. No CORS issues because the call is server-side.
- `POST /api/chat` — body: `{ messages, apiKey? }` — streams an OpenAI `gpt-4o-mini` chat completion back as SSE. Uses `OPENAI_API_KEY` env var if set, otherwise falls back to `apiKey` in the body.
