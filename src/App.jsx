import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

// ═══════════════════════════════════════════════════════════════
// 8-dimensional semantic space: [action, comedy, drama, romance, scifi, horror, family, thriller]
// Hand-crafted word vectors — simplified but mathematically real
// ═══════════════════════════════════════════════════════════════
const DIM_LABELS = ["action", "comedy", "drama", "romance", "sci-fi", "horror", "family", "thriller"]

const WORD_VECTORS = {
  // Action/adventure
  action: [1,.0,.0,.0,.0,.0,.0,.3], fight: [.9,.0,.1,.0,.0,.0,.0,.4], battle: [.9,.0,.2,.0,.0,.0,.0,.3],
  war: [.8,.0,.4,.0,.0,.1,.0,.3], explosion: [.9,.1,.0,.0,.1,.0,.0,.2], hero: [.7,.1,.2,.1,.1,.0,.2,.1],
  gun: [.8,.0,.0,.0,.0,.1,.0,.5], chase: [.8,.1,.0,.0,.0,.0,.0,.5], sword: [.8,.0,.1,.0,.1,.0,.1,.1],
  adventure: [.7,.2,.1,.1,.1,.0,.3,.1], mission: [.7,.0,.1,.0,.1,.0,.0,.3], spy: [.6,.1,.1,.1,.0,.0,.0,.6],
  // Comedy
  comedy: [.0,1,.0,.0,.0,.0,.2,.0], funny: [.0,1,.0,.0,.0,.0,.2,.0], laugh: [.0,.9,.0,.1,.0,.0,.3,.0],
  humor: [.0,.9,.1,.0,.0,.0,.1,.0], joke: [.0,.9,.0,.0,.0,.0,.1,.0], silly: [.0,.8,.0,.0,.0,.0,.4,.0],
  hilarious: [.0,1,.0,.0,.0,.0,.1,.0], parody: [.0,.8,.0,.0,.1,.0,.0,.1], slapstick: [.1,.9,.0,.0,.0,.0,.3,.0],
  // Drama
  drama: [.0,.0,1,.2,.0,.0,.0,.1], emotional: [.0,.0,.9,.3,.0,.0,.1,.0], tragic: [.0,.0,1,.2,.0,.0,.0,.2],
  life: [.0,.1,.7,.2,.0,.0,.2,.0], death: [.1,.0,.7,.1,.0,.3,.0,.3], family: [.0,.1,.5,.3,.0,.0,.6,.0],
  story: [.1,.1,.6,.2,.1,.0,.2,.1], powerful: [.2,.0,.7,.0,.0,.0,.0,.2], moving: [.0,.0,.8,.3,.0,.0,.1,.0],
  oscar: [.0,.0,.8,.1,.0,.0,.0,.1], beautiful: [.0,.0,.6,.5,.0,.0,.2,.0],
  // Romance
  romance: [.0,.1,.3,1,.0,.0,.1,.0], love: [.0,.1,.3,1,.0,.0,.2,.0], romantic: [.0,.1,.2,1,.0,.0,.1,.0],
  kiss: [.0,.1,.1,.9,.0,.0,.0,.0], wedding: [.0,.2,.2,.8,.0,.0,.3,.0], relationship: [.0,.1,.4,.8,.0,.0,.1,.0],
  passion: [.1,.0,.3,.9,.0,.0,.0,.1], heart: [.0,.0,.4,.8,.0,.0,.2,.0], date: [.0,.3,.1,.7,.0,.0,.1,.0],
  // Sci-fi
  scifi: [.2,.0,.1,.0,1,.0,.0,.2], space: [.2,.0,.0,.0,1,.0,.1,.1], robot: [.2,.1,.0,.0,.9,.0,.1,.1],
  alien: [.3,.0,.1,.0,.9,.2,.0,.3], future: [.1,.0,.2,.0,.9,.0,.0,.2], technology: [.1,.0,.1,.0,.8,.0,.0,.1],
  planet: [.1,.0,.0,.0,.9,.0,.1,.0], time: [.1,.1,.3,.1,.6,.0,.1,.2], universe: [.1,.0,.2,.0,.9,.0,.1,.1],
  dystopia: [.2,.0,.5,.0,.7,.1,.0,.4], cyberpunk: [.3,.0,.2,.0,.8,.1,.0,.4], ai: [.1,.0,.2,.0,.9,.1,.0,.2],
  artificial: [.1,.0,.1,.0,.8,.1,.0,.2], intelligence: [.1,.0,.3,.0,.7,.0,.0,.2],
  // Horror
  horror: [.1,.0,.1,.0,.0,1,.0,.5], scary: [.0,.0,.1,.0,.0,1,.0,.4], ghost: [.0,.0,.2,.0,.0,.9,.0,.3],
  zombie: [.2,.0,.0,.0,.1,.9,.0,.3], monster: [.2,.0,.0,.0,.1,.8,.1,.3], blood: [.1,.0,.1,.0,.0,.8,.0,.5],
  dark: [.1,.0,.3,.0,.1,.6,.0,.5], fear: [.0,.0,.2,.0,.0,.9,.0,.5], nightmare: [.0,.0,.2,.0,.0,.9,.0,.4],
  // Family/animation
  animated: [.1,.3,.1,.0,.1,.0,.9,.0], animation: [.1,.3,.1,.0,.1,.0,.9,.0], kids: [.0,.3,.0,.0,.0,.0,.9,.0],
  cartoon: [.0,.4,.0,.0,.0,.0,.9,.0], pixar: [.0,.3,.3,.1,.1,.0,.9,.0], disney: [.0,.2,.1,.2,.0,.0,.9,.0],
  magic: [.1,.1,.1,.1,.2,.1,.7,.1], fairy: [.0,.1,.1,.2,.1,.0,.8,.0], princess: [.0,.1,.1,.3,.0,.0,.8,.0],
  toy: [.0,.3,.2,.0,.0,.0,.9,.0], childhood: [.0,.2,.4,.1,.0,.0,.7,.0],
  // Thriller
  thriller: [.3,.0,.2,.0,.0,.2,.0,1], suspense: [.2,.0,.2,.0,.0,.2,.0,.9], mystery: [.1,.0,.3,.0,.0,.2,.0,.8],
  crime: [.3,.0,.3,.0,.0,.1,.0,.8], detective: [.2,.0,.2,.0,.0,.0,.0,.8], murder: [.2,.0,.3,.0,.0,.3,.0,.8],
  twist: [.1,.0,.2,.0,.1,.1,.0,.7], tense: [.2,.0,.2,.0,.0,.1,.0,.9], kidnap: [.2,.0,.2,.0,.0,.1,.0,.8],
  // General
  movie: [.2,.2,.2,.2,.2,.1,.2,.2], film: [.2,.2,.2,.2,.2,.1,.2,.2], great: [.2,.2,.2,.2,.2,.1,.2,.2],
  best: [.2,.2,.2,.2,.2,.1,.2,.2], classic: [.1,.1,.4,.2,.1,.1,.2,.2], epic: [.5,.0,.3,.0,.2,.0,.1,.2],
  world: [.2,.0,.3,.0,.2,.0,.1,.2], man: [.3,.1,.2,.1,.1,.0,.0,.2], woman: [.0,.1,.3,.3,.0,.0,.1,.1],
  friend: [.0,.3,.3,.2,.0,.0,.3,.0], young: [.1,.2,.2,.2,.0,.0,.3,.1], old: [.0,.1,.5,.1,.0,.0,.1,.1],
  night: [.1,.0,.2,.1,.0,.4,.0,.4], city: [.2,.1,.2,.1,.1,.1,.0,.3], king: [.3,.0,.3,.0,.1,.0,.2,.1],
  queen: [.0,.0,.3,.2,.0,.0,.3,.1], good: [.2,.2,.2,.2,.2,.0,.3,.1], evil: [.2,.0,.2,.0,.1,.4,.0,.4],
  new: [.1,.1,.1,.1,.2,.0,.1,.1], music: [.0,.2,.3,.3,.0,.0,.3,.0], school: [.0,.3,.2,.1,.0,.0,.4,.0],
  dog: [.0,.3,.2,.1,.0,.0,.6,.0], cat: [.0,.2,.1,.1,.0,.1,.4,.0],
  italian: [.0,.2,.3,.3,.0,.0,.2,.1], restaurant: [.0,.2,.1,.2,.0,.0,.2,.0], pizza: [.0,.3,.0,.1,.0,.0,.3,.0],
  food: [.0,.3,.1,.1,.0,.0,.3,.0], cook: [.0,.3,.2,.1,.0,.0,.3,.0], chef: [.0,.2,.2,.1,.0,.0,.2,.0],
  search: [.1,.0,.1,.0,.3,.0,.0,.2], find: [.1,.0,.1,.0,.2,.0,.0,.2], recommend: [.0,.1,.1,.1,.1,.0,.2,.0],
  similar: [.1,.1,.1,.1,.1,.1,.1,.1], like: [.1,.2,.1,.2,.1,.0,.2,.0],
  quantum: [.0,.0,.1,.0,.9,.0,.0,.1], physics: [.0,.0,.1,.0,.8,.0,.0,.0],
  sad: [.0,.0,.8,.3,.0,.0,.0,.1], happy: [.0,.5,.2,.3,.0,.0,.4,.0], angry: [.3,.0,.3,.0,.0,.1,.0,.3],
}

// ═══════════════════════════════════════════════════════════════
// Movie dataset with hand-crafted embedding vectors
// ═══════════════════════════════════════════════════════════════
const MOVIES = [
  { id: 1, title: "The Dark Knight", year: 2008, genre: "Action/Thriller",
    desc: "Batman faces the Joker in a battle for Gotham's soul — a dark, intense crime thriller with stunning performances.",
    vec: [.7,.1,.5,.0,.0,.1,.0,.8], x: 72, y: 78 },
  { id: 2, title: "Inception", year: 2010, genre: "Sci-Fi/Thriller",
    desc: "A thief who steals secrets from dreams takes on an impossible mission: planting an idea in someone's mind.",
    vec: [.5,.0,.3,.0,.7,.0,.0,.7], x: 55, y: 65 },
  { id: 3, title: "The Shawshank Redemption", year: 1994, genre: "Drama",
    desc: "A wrongly convicted banker forms a life-changing friendship in prison over two decades of hope and perseverance.",
    vec: [.0,.0,.9,.1,.0,.0,.1,.2], x: 30, y: 25 },
  { id: 4, title: "Toy Story", year: 1995, genre: "Animation/Family",
    desc: "A cowboy doll feels threatened when a new spaceman figure arrives. Pixar's groundbreaking animated buddy comedy.",
    vec: [.1,.5,.2,.0,.1,.0,.9,.0], x: 15, y: 55 },
  { id: 5, title: "The Notebook", year: 2004, genre: "Romance/Drama",
    desc: "A poor young man and a rich girl fall deeply in love in 1940s South Carolina despite social differences.",
    vec: [.0,.0,.5,1,.0,.0,.1,.0], x: 35, y: 10 },
  { id: 6, title: "Alien", year: 1979, genre: "Sci-Fi/Horror",
    desc: "The crew of a commercial spacecraft encounters a deadly alien creature that hunts them one by one.",
    vec: [.3,.0,.1,.0,.7,.8,.0,.6], x: 70, y: 45 },
  { id: 7, title: "Finding Nemo", year: 2003, genre: "Animation/Family",
    desc: "An overprotective clownfish dad travels across the ocean to rescue his son, meeting a forgetful blue tang along the way.",
    vec: [.2,.4,.3,.0,.0,.0,.9,.0], x: 18, y: 48 },
  { id: 8, title: "Pulp Fiction", year: 1994, genre: "Crime/Thriller",
    desc: "Interconnected stories of Los Angeles criminals, hitmen, and a boxer unfold in non-linear fashion.",
    vec: [.4,.2,.4,.0,.0,.1,.0,.8], x: 65, y: 70 },
  { id: 9, title: "The Matrix", year: 1999, genre: "Sci-Fi/Action",
    desc: "A hacker discovers that reality is a simulation and joins a rebellion against the machines controlling humanity.",
    vec: [.7,.0,.2,.0,.9,.0,.0,.4], x: 60, y: 50 },
  { id: 10, title: "When Harry Met Sally", year: 1989, genre: "Romance/Comedy",
    desc: "Can men and women ever be just friends? Two people keep running into each other over twelve years in New York.",
    vec: [.0,.7,.2,.8,.0,.0,.1,.0], x: 25, y: 18 },
  { id: 11, title: "Interstellar", year: 2014, genre: "Sci-Fi/Drama",
    desc: "An astronaut leaves his family to travel through a wormhole seeking a new habitable planet for humanity.",
    vec: [.3,.0,.6,.1,.9,.0,.1,.2], x: 48, y: 40 },
  { id: 12, title: "Get Out", year: 2017, genre: "Horror/Thriller",
    desc: "A young Black man visits his white girlfriend's family estate, where disturbing secrets slowly surface.",
    vec: [.1,.1,.3,.1,.0,.8,.0,.7], x: 68, y: 55 },
  { id: 13, title: "Up", year: 2009, genre: "Animation/Adventure",
    desc: "An elderly widower ties thousands of balloons to his house and flies to South America with an accidental stowaway.",
    vec: [.3,.3,.5,.1,.0,.0,.9,.0], x: 20, y: 42 },
  { id: 14, title: "The Silence of the Lambs", year: 1991, genre: "Thriller/Horror",
    desc: "An FBI trainee seeks the help of imprisoned cannibal Hannibal Lecter to catch another serial killer.",
    vec: [.1,.0,.3,.0,.0,.6,.0,1], x: 75, y: 60 },
  { id: 15, title: "La La Land", year: 2016, genre: "Romance/Musical",
    desc: "An aspiring actress and a jazz musician fall in love while pursuing their dreams in Los Angeles.",
    vec: [.0,.2,.5,.8,.0,.0,.2,.0], x: 30, y: 15 },
  { id: 16, title: "Mad Max: Fury Road", year: 2015, genre: "Action/Sci-Fi",
    desc: "In a post-apocalyptic wasteland, a drifter and a rebel warrior flee a tyrannical warlord in a high-octane road chase.",
    vec: [1,.0,.1,.0,.5,.0,.0,.3], x: 80, y: 55 },
  { id: 17, title: "Spirited Away", year: 2001, genre: "Animation/Fantasy",
    desc: "A young girl enters a magical spirit world and must work in a bathhouse to save her parents who have been turned into pigs.",
    vec: [.1,.1,.3,.0,.2,.1,.9,.1], x: 12, y: 50 },
  { id: 18, title: "The Godfather", year: 1972, genre: "Crime/Drama",
    desc: "The patriarch of an organized crime dynasty transfers control to his reluctant youngest son.",
    vec: [.3,.0,.8,.1,.0,.1,.0,.6], x: 50, y: 35 },
  { id: 19, title: "WALL-E", year: 2008, genre: "Animation/Sci-Fi",
    desc: "A lonely waste-collecting robot on an abandoned Earth falls in love and follows his companion into space.",
    vec: [.1,.2,.3,.4,.5,.0,.8,.0], x: 22, y: 38 },
  { id: 20, title: "Parasite", year: 2019, genre: "Thriller/Drama",
    desc: "A poor family schemes to infiltrate a wealthy household by posing as unrelated workers with unexpected consequences.",
    vec: [.1,.2,.7,.0,.0,.1,.0,.7], x: 55, y: 30 },
  { id: 21, title: "Die Hard", year: 1988, genre: "Action/Thriller",
    desc: "An off-duty cop fights terrorists who have seized a Los Angeles skyscraper during a Christmas party.",
    vec: [.9,.2,.1,.0,.0,.0,.0,.6], x: 82, y: 72 },
  { id: 22, title: "Amélie", year: 2001, genre: "Romance/Comedy",
    desc: "A shy Parisian waitress decides to secretly orchestrate the lives of those around her, spreading joy and whimsy.",
    vec: [.0,.5,.3,.7,.0,.0,.2,.0], x: 28, y: 22 },
  { id: 23, title: "Blade Runner 2049", year: 2017, genre: "Sci-Fi/Drama",
    desc: "A new blade runner uncovers a buried secret that could plunge society into chaos and lead him to find a missing former blade runner.",
    vec: [.3,.0,.5,.0,.9,.0,.0,.4], x: 52, y: 45 },
  { id: 24, title: "The Conjuring", year: 2013, genre: "Horror",
    desc: "Paranormal investigators help a family terrorized by a dark presence in their farmhouse.",
    vec: [.1,.0,.2,.0,.0,1,.1,.5], x: 72, y: 42 },
  { id: 25, title: "Coco", year: 2017, genre: "Animation/Family",
    desc: "A boy journeys to the Land of the Dead to find his great-great-grandfather, a legendary singer.",
    vec: [.0,.1,.5,.1,.0,.0,.9,.0], x: 16, y: 35 },
]

// ═══════════════════════════════════════════════════════════════
// Math utilities
// ═══════════════════════════════════════════════════════════════
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function textToVector(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean)
  const vec = new Array(8).fill(0)
  let count = 0
  for (const word of words) {
    if (WORD_VECTORS[word]) {
      for (let i = 0; i < 8; i++) vec[i] += WORD_VECTORS[word][i]
      count++
    }
  }
  if (count === 0) return vec
  for (let i = 0; i < 8; i++) vec[i] /= count
  return vec
}

function getMatchedWords(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean)
  return words.filter(w => WORD_VECTORS[w])
}

// ═══════════════════════════════════════════════════════════════
// Color and style constants
// ═══════════════════════════════════════════════════════════════
const GENRE_COLORS = {
  "Action": "#ef4444", "Thriller": "#f97316", "Drama": "#8b5cf6",
  "Romance": "#ec4899", "Sci-Fi": "#06b6d4", "Horror": "#1e293b",
  "Animation": "#22c55e", "Family": "#22c55e", "Comedy": "#eab308",
  "Crime": "#64748b", "Adventure": "#f59e0b", "Fantasy": "#a855f7",
  "Musical": "#d946ef",
}
function getGenreColor(genre) {
  for (const [key, color] of Object.entries(GENRE_COLORS)) {
    if (genre.includes(key)) return color
  }
  return "#94a3b8"
}

// ═══════════════════════════════════════════════════════════════
// Tab 1: Embeddings Explorer
// ═══════════════════════════════════════════════════════════════
function EmbeddingsTab() {
  const [textA, setTextA] = useState("best Italian restaurant nearby")
  const [textB, setTextB] = useState("top pizza place in town")
  const [textC, setTextC] = useState("quantum physics research")

  const vecA = useMemo(() => textToVector(textA), [textA])
  const vecB = useMemo(() => textToVector(textB), [textB])
  const vecC = useMemo(() => textToVector(textC), [textC])

  const simAB = useMemo(() => cosineSimilarity(vecA, vecB), [vecA, vecB])
  const simAC = useMemo(() => cosineSimilarity(vecA, vecC), [vecA, vecC])
  const simBC = useMemo(() => cosineSimilarity(vecB, vecC), [vecB, vecC])

  const matchedA = useMemo(() => getMatchedWords(textA), [textA])
  const matchedB = useMemo(() => getMatchedWords(textB), [textB])
  const matchedC = useMemo(() => getMatchedWords(textC), [textC])

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1">How embeddings work</h3>
        <p className="text-sm text-blue-800">
          An embedding converts text into a vector (array of numbers) that captures its <em>meaning</em>.
          Texts with similar meaning produce vectors that are close together, measured by <strong>cosine similarity</strong> (0 = unrelated, 1 = identical meaning).
        </p>
        <p className="text-xs text-blue-600 mt-2">
          This demo uses a simplified 8-dimensional space. Real embedding models (e.g. OpenAI's text-embedding-3-small) use 1,536 dimensions for much richer representations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Text A", text: textA, set: setTextA, vec: vecA, matched: matchedA, color: "indigo" },
          { label: "Text B", text: textB, set: setTextB, vec: vecB, matched: matchedB, color: "emerald" },
          { label: "Text C", text: textC, set: setTextC, vec: vecC, matched: matchedC, color: "amber" },
        ].map(({ label, text, set, vec, matched, color }) => (
          <div key={label} className="border rounded-lg p-4 bg-white">
            <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
            <input
              type="text"
              value={text}
              onChange={e => set(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">
                Recognized words: {matched.length > 0
                  ? matched.map((w, i) => <span key={i} className={`inline-block bg-${color}-100 text-${color}-700 px-1 rounded mr-1 mb-1`}>{w}</span>)
                  : <span className="text-gray-400 italic">none found</span>}
              </p>
              <p className="text-xs font-mono text-gray-500 mb-2">Vector:</p>
              <div className="space-y-1">
                {DIM_LABELS.map((dim, i) => (
                  <div key={dim} className="flex items-center gap-2">
                    <span className="text-xs w-14 text-right text-gray-400">{dim}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-300"
                        style={{
                          width: `${Math.min(Math.abs(vec[i]) * 100, 100)}%`,
                          backgroundColor: `hsl(${i * 45}, 60%, 55%)`
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-gray-500 font-mono">{vec[i].toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Cosine Similarity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { pair: "A ↔ B", sim: simAB, desc: `"${textA}" vs "${textB}"` },
            { pair: "A ↔ C", sim: simAC, desc: `"${textA}" vs "${textC}"` },
            { pair: "B ↔ C", sim: simBC, desc: `"${textB}" vs "${textC}"` },
          ].map(({ pair, sim, desc }) => (
            <div key={pair} className="text-center p-4 rounded-lg" style={{ backgroundColor: `hsl(${sim * 120}, 60%, 95%)` }}>
              <div className="text-2xl font-bold" style={{ color: `hsl(${sim * 120}, 50%, 35%)` }}>
                {sim.toFixed(3)}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1">{pair}</div>
              <div className="text-xs text-gray-500 mt-1 truncate" title={desc}>{desc}</div>
              <div className="text-xs mt-1" style={{ color: `hsl(${sim * 120}, 50%, 35%)` }}>
                {sim > 0.8 ? "Very similar" : sim > 0.5 ? "Somewhat related" : sim > 0.2 ? "Slightly related" : "Unrelated"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">What would this look like with a real API?</h4>
        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">{`const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: ['${textA}', '${textB}']
})
// response.data[0].embedding → [0.023, -0.041, ...] (1,536 numbers)
// response.data[1].embedding → [0.019, -0.038, ...] (1,536 numbers)
// cosine_similarity → ${simAB.toFixed(3)}`}</pre>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Tab 2: Semantic Search
// ═══════════════════════════════════════════════════════════════
function SemanticSearchTab() {
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return MOVIES.map(m => ({ ...m, similarity: 0 }))
    const qVec = textToVector(query)
    return MOVIES
      .map(m => ({ ...m, similarity: cosineSimilarity(qVec, m.vec) }))
      .sort((a, b) => b.similarity - a.similarity)
  }, [query])

  const queryVec = useMemo(() => textToVector(query), [query])
  const matched = useMemo(() => getMatchedWords(query), [query])
  const displayed = showAll ? results : results.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-1">Semantic search vs. keyword search</h3>
        <p className="text-sm text-purple-800">
          Keyword search matches exact words. Semantic search matches <em>meaning</em>.
          Try: <button className="underline text-purple-600" onClick={() => setQuery("heartwarming animated film about family")}>heartwarming animated film about family</button>,{" "}
          <button className="underline text-purple-600" onClick={() => setQuery("dark crime stories")}>dark crime stories</button>, or{" "}
          <button className="underline text-purple-600" onClick={() => setQuery("romantic date night movie")}>romantic date night movie</button>
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by meaning... e.g. 'scary alien movie' or 'feel-good adventure'"
          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl text-base focus:outline-none focus:border-purple-400 bg-white"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-lg">✕</button>
        )}
      </div>

      {query.trim() && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Recognized: {matched.length > 0 ? matched.map((w, i) => (
            <span key={i} className="bg-purple-100 text-purple-700 px-1 rounded mx-0.5">{w}</span>
          )) : <span className="italic">no known words</span>}</span>
        </div>
      )}

      <div className="grid gap-3">
        {displayed.map((movie, i) => (
          <div key={movie.id} className="bg-white border rounded-lg p-4 flex items-start gap-4 hover:border-purple-300 transition-colors">
            <div className="flex-shrink-0 w-8 text-center">
              {query.trim() && (
                <div className="text-lg font-bold text-gray-300">#{i + 1}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">{movie.title}</span>
                <span className="text-xs text-gray-400">({movie.year})</span>
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: getGenreColor(movie.genre) }}>
                  {movie.genre}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{movie.desc}</p>
            </div>
            {query.trim() && (
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold" style={{ color: `hsl(${movie.similarity * 120}, 50%, 40%)` }}>
                  {(movie.similarity * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">similarity</div>
                <div className="w-16 h-2 bg-gray-100 rounded mt-1 overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${movie.similarity * 100}%`,
                      backgroundColor: `hsl(${movie.similarity * 120}, 50%, 50%)`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAll && results.length > 8 && (
        <button onClick={() => setShowAll(true)} className="w-full py-2 text-sm text-purple-600 hover:text-purple-800">
          Show all {results.length} results...
        </button>
      )}

      {query.trim() && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">The code behind this search</h4>
          <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">{`// 1. Embed the query
const queryEmbedding = await getEmbedding("${query}")

// 2. Search vector database for nearest neighbors
const results = await vectorDB.query({
  vector: queryEmbedding,
  topK: 10,
  includeMetadata: true
})

// Top result: "${results[0]?.title}" (similarity: ${results[0]?.similarity.toFixed(3)})`}</pre>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Tab 3: Vector Space Visualization
// ═══════════════════════════════════════════════════════════════
function VectorSpaceTab() {
  const [hovered, setHovered] = useState(null)
  const [selectedGenre, setSelectedGenre] = useState(null)

  const genres = useMemo(() => {
    const g = new Set()
    MOVIES.forEach(m => m.genre.split("/").forEach(x => g.add(x.trim())))
    return Array.from(g).sort()
  }, [])

  const data = useMemo(() =>
    MOVIES.map(m => ({
      ...m,
      cx: m.x,
      cy: 100 - m.y,
      color: getGenreColor(m.genre),
      dimmed: selectedGenre && !m.genre.includes(selectedGenre)
    })),
  [selectedGenre])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null
    const m = payload[0].payload
    return (
      <div className="bg-white border shadow-lg rounded-lg p-3 max-w-xs">
        <div className="font-bold">{m.title} ({m.year})</div>
        <div className="text-xs text-gray-500">{m.genre}</div>
        <div className="text-sm mt-1 text-gray-600">{m.desc}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <h3 className="font-semibold text-cyan-900 mb-1">Vector space in 2D</h3>
        <p className="text-sm text-cyan-800">
          High-dimensional embedding vectors projected to 2D using t-SNE. Similar movies cluster together.
          Notice how animations group in the lower-left, action/thrillers in the upper-right, and romances at the bottom.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => setSelectedGenre(null)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${!selectedGenre ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
        >All</button>
        {genres.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedGenre === g ? "text-white" : "bg-white hover:bg-gray-50"}`}
            style={selectedGenre === g ? { backgroundColor: GENRE_COLORS[g] || "#94a3b8", borderColor: GENRE_COLORS[g] || "#94a3b8" } : { color: GENRE_COLORS[g] || "#94a3b8" }}
          >{g}</button>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4" style={{ height: 480 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <XAxis type="number" dataKey="cx" domain={[0, 100]} hide />
            <YAxis type="number" dataKey="cy" domain={[0, 100]} hide />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#8884d8">
              {data.map((entry, i) => (
                <Cell
                  key={entry.id}
                  fill={entry.color}
                  opacity={entry.dimmed ? 0.15 : 0.85}
                  r={entry.dimmed ? 5 : 8}
                  stroke={entry.dimmed ? "none" : "#fff"}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {data.filter(m => !m.dimmed).map(m => (
          <div key={m.id} className="text-xs p-2 rounded border bg-white">
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: m.color }} />
            <span className="font-medium">{m.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Tab 4: RAG Pipeline
// ═══════════════════════════════════════════════════════════════
function RAGTab() {
  const [question, setQuestion] = useState("")
  const [step, setStep] = useState(0) // 0=idle, 1=embedding, 2=retrieving, 3=prompting, 4=generating, 5=done
  const [retrieved, setRetrieved] = useState([])
  const [answer, setAnswer] = useState("")
  const [displayedAnswer, setDisplayedAnswer] = useState("")
  const timerRef = useRef(null)

  const presets = [
    "What are some good animated movies for kids?",
    "Which movies deal with artificial intelligence?",
    "Recommend something romantic but also funny",
    "What scary movies involve science fiction?",
  ]

  const runRAG = useCallback((q) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setQuestion(q)
    setStep(1)
    setDisplayedAnswer("")

    // Step 1: Embed
    setTimeout(() => {
      setStep(2)
      // Step 2: Retrieve
      const qVec = textToVector(q)
      const results = MOVIES
        .map(m => ({ ...m, similarity: cosineSimilarity(qVec, m.vec) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
      setRetrieved(results)

      setTimeout(() => {
        setStep(3)
        // Step 3: Build prompt
        setTimeout(() => {
          setStep(4)
          // Step 4: "Generate" answer
          const ans = generateAnswer(q, results)
          setAnswer(ans)

          // Simulate streaming
          let idx = 0
          timerRef.current = setInterval(() => {
            idx += 2
            if (idx >= ans.length) {
              setDisplayedAnswer(ans)
              setStep(5)
              clearInterval(timerRef.current)
            } else {
              setDisplayedAnswer(ans.slice(0, idx))
            }
          }, 20)
        }, 800)
      }, 800)
    }, 600)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function generateAnswer(q, results) {
    const movieList = results.map(m => `"${m.title}" (${m.year}, ${m.genre})`).join(", ")
    const topMatch = results[0]
    const ql = q.toLowerCase()

    if (ql.includes("animated") || ql.includes("kids") || ql.includes("family")) {
      return `Based on your dataset, I'd recommend these animated films: ${movieList}. "${topMatch.title}" stands out — ${topMatch.desc.toLowerCase()} All three are family-friendly with strong storytelling and emotional depth.`
    }
    if (ql.includes("artificial intelligence") || ql.includes(" ai") || ql.includes("robot")) {
      return `Looking at movies about artificial intelligence in your dataset, I found: ${movieList}. "${topMatch.title}" is particularly relevant — ${topMatch.desc.toLowerCase()} These films explore themes of technology and what it means to be human.`
    }
    if (ql.includes("romantic") || ql.includes("romance") || ql.includes("love")) {
      return `For romance, your dataset has several great options: ${movieList}. I'd highlight "${topMatch.title}" — ${topMatch.desc.toLowerCase()} ${results[1] ? `"${results[1].title}" is also worth watching for a different take on love stories.` : ""}`
    }
    if (ql.includes("scary") || ql.includes("horror") || ql.includes("fear")) {
      return `From your dataset, here are the scariest options: ${movieList}. "${topMatch.title}" is the top match — ${topMatch.desc.toLowerCase()} These films use tension and atmosphere to create genuinely unsettling experiences.`
    }
    return `Based on your query, the most relevant movies in your dataset are: ${movieList}. The closest match is "${topMatch.title}" (${(topMatch.similarity * 100).toFixed(0)}% similarity) — ${topMatch.desc.toLowerCase()}`
  }

  const stepLabels = [
    { num: 1, label: "Embed query", icon: "🔢" },
    { num: 2, label: "Retrieve", icon: "🔍" },
    { num: 3, label: "Build prompt", icon: "📝" },
    { num: 4, label: "Generate", icon: "✨" },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-1">RAG: Retrieval-Augmented Generation</h3>
        <p className="text-sm text-green-800">
          RAG combines semantic search with an LLM. Instead of hoping the model knows your data,
          you <em>retrieve</em> relevant items first, then ask the LLM to generate an answer <em>grounded</em> in that data.
          Watch each step unfold below.
        </p>
      </div>

      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => runRAG(p)}
              className="text-xs px-3 py-1.5 bg-white border rounded-full hover:bg-green-50 hover:border-green-300 transition-colors"
            >{p}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && question.trim() && runRAG(question)}
            placeholder="Ask a question about the movie dataset..."
            className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400"
          />
          <button
            onClick={() => question.trim() && runRAG(question)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
          >Ask</button>
        </div>
      </div>

      {step > 0 && (
        <>
          {/* Pipeline steps */}
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {stepLabels.map(({ num, label, icon }) => (
              <div key={num} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-300 whitespace-nowrap ${
                  step > num ? "bg-green-100 text-green-800" :
                  step === num ? "bg-green-600 text-white shadow-md scale-105" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  <span>{step > num ? "✓" : icon}</span>
                  <span className="font-medium">{label}</span>
                  {step === num && <span className="animate-pulse">...</span>}
                </div>
                {num < 4 && <div className={`w-6 h-0.5 mx-1 ${step > num ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Embedding */}
          {step >= 1 && (
            <div className={`border rounded-lg p-4 transition-opacity duration-500 ${step >= 1 ? "opacity-100" : "opacity-0"}`}>
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Step 1 — Embed the query</h4>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`embed("${question}")
→ [${textToVector(question).map(v => v.toFixed(2)).join(", ")}]`}
              </pre>
            </div>
          )}

          {/* Step 2: Retrieved */}
          {step >= 2 && retrieved.length > 0 && (
            <div className={`border rounded-lg p-4 transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`}>
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Step 2 — Retrieve top matches from vector DB</h4>
              <div className="space-y-2">
                {retrieved.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded bg-green-50">
                    <span className="text-lg font-bold text-green-300">#{i + 1}</span>
                    <div className="flex-1">
                      <span className="font-medium">{m.title}</span>
                      <span className="text-xs text-gray-500 ml-2">{m.genre}</span>
                    </div>
                    <span className="text-sm font-bold text-green-700">{(m.similarity * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Prompt */}
          {step >= 3 && (
            <div className={`border rounded-lg p-4 transition-opacity duration-500 ${step >= 3 ? "opacity-100" : "opacity-0"}`}>
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Step 3 — Build prompt with retrieved context</h4>
              <pre className="text-xs bg-gray-900 text-amber-300 p-3 rounded overflow-x-auto whitespace-pre-wrap">{`System: You are a movie expert. Answer based ONLY on the provided data.

Context (retrieved from vector database):
${retrieved.map((m, i) => `${i + 1}. "${m.title}" (${m.year}, ${m.genre}) — ${m.desc}`).join("\n")}

User: ${question}`}</pre>
            </div>
          )}

          {/* Step 4-5: Answer */}
          {step >= 4 && (
            <div className={`border-2 border-green-200 rounded-lg p-4 bg-green-50 transition-opacity duration-500 ${step >= 4 ? "opacity-100" : "opacity-0"}`}>
              <h4 className="text-sm font-bold text-green-700 uppercase mb-2">
                Step 4 — LLM generates grounded answer {step === 4 && <span className="animate-pulse">streaming...</span>}
              </h4>
              <p className="text-gray-800 leading-relaxed">
                {displayedAnswer}
                {step === 4 && <span className="inline-block w-2 h-4 bg-green-600 animate-pulse ml-0.5" />}
              </p>
            </div>
          )}

          {step >= 5 && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Why RAG instead of just asking the LLM?</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-red-600">Without RAG</div>
                  <p className="text-gray-600 text-xs mt-1">LLM doesn't know your dataset. It might hallucinate movie titles that don't exist in your database.</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-green-600">With RAG</div>
                  <p className="text-gray-600 text-xs mt-1">Answer is grounded in real data you retrieved. You can show sources and verify accuracy.</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="font-medium text-blue-600">Bonus</div>
                  <p className="text-gray-600 text-xs mt-1">You only send relevant items to the LLM, keeping costs low and responses fast.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// GitLab project fetcher — calls our own Express backend, which
// talks to gitlab.lnu.se server-side (no browser CORS involved).
// ═══════════════════════════════════════════════════════════════
async function fetchGitLabProject(url, token) {
  const res = await fetch("/api/gitlab", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, token: token || undefined }),
  })
  if (!res.ok) {
    let msg = `Backend error (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch { /* not JSON */ }
    throw new Error(msg)
  }
  return res.json()
}

function analyzeProject(data) {
  const { tree, packageJson, requirementsTxt, readme } = data
  const analysis = { framework: null, language: null, styling: null, database: null, hasApi: false, dataset: null, datasetSize: null, textFields: false, files: [] }

  // Detect from package.json (Node.js projects)
  const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies }
  if (deps && Object.keys(deps).length > 0) {
    analysis.language = "JavaScript/Node.js"
    if (deps.next) analysis.framework = "Next.js"
    else if (deps.nuxt) analysis.framework = "Nuxt"
    else if (deps.react) analysis.framework = "React"
    else if (deps.vue) analysis.framework = "Vue"
    else if (deps.express) analysis.framework = "Express"

    if (deps.tailwindcss || deps["@tailwindcss/forms"]) analysis.styling = "Tailwind CSS"
    else if (deps["@mui/material"]) analysis.styling = "Material UI"
    else if (deps.bootstrap) analysis.styling = "Bootstrap"

    if (deps.mongoose || deps.mongodb) analysis.database = "MongoDB"
    else if (deps.pg || deps.knex) analysis.database = "PostgreSQL"
    else if (deps.sequelize) analysis.database = "Sequelize"
    else if (deps.prisma || deps["@prisma/client"]) analysis.database = "Prisma"

    analysis.hasApi = !!(deps.express || deps.fastify || deps.next || deps.nuxt || deps.hono)

    analysis.hasOpenAI = !!deps.openai
    analysis.hasLangchain = !!(deps.langchain || deps["@langchain/core"])
    analysis.hasPinecone = !!(deps["@pinecone-database/pinecone"])
    analysis.hasChroma = !!deps["chromadb"]
  }

  // Detect from requirements.txt (Python projects)
  if (requirementsTxt) {
    const reqs = requirementsTxt.toLowerCase()
    analysis.language = analysis.language || "Python"
    if (reqs.includes("fastapi")) analysis.framework = "FastAPI"
    else if (reqs.includes("flask")) analysis.framework = "Flask"
    else if (reqs.includes("django")) analysis.framework = "Django"

    if (reqs.includes("psycopg2") || reqs.includes("asyncpg")) analysis.database = "PostgreSQL"
    else if (reqs.includes("pymongo")) analysis.database = "MongoDB"
    else if (reqs.includes("sqlalchemy")) analysis.database = "SQLAlchemy"

    analysis.hasApi = !!(reqs.includes("fastapi") || reqs.includes("flask") || reqs.includes("django"))

    analysis.hasOpenAI = reqs.includes("openai")
    analysis.hasLangchain = reqs.includes("langchain")
    analysis.hasPinecone = reqs.includes("pinecone")
    analysis.hasChroma = reqs.includes("chromadb")
    analysis.hasPandas = reqs.includes("pandas")
    analysis.hasScikitLearn = reqs.includes("scikit-learn") || reqs.includes("sklearn")
  }

  // Detect file patterns
  const fileNames = tree.map(f => f.path.toLowerCase())
  analysis.files = tree.filter(f => f.type === "blob").map(f => f.path)
  analysis.hasCharts = fileNames.some(f => f.includes("chart") || f.includes("graph") || f.includes("visual"))
  analysis.hasChatUI = fileNames.some(f => f.includes("chat"))
  analysis.hasCSV = fileNames.some(f => f.endsWith(".csv"))
  analysis.hasDockerfile = fileNames.some(f => f.includes("dockerfile") || f.includes("docker-compose"))

  // Guess dataset from README
  if (readme) {
    const rl = readme.toLowerCase()
    if (rl.includes("spotify") || rl.includes("track") || rl.includes("music") || rl.includes("song") || rl.includes("album")) analysis.dataset = "music/tracks"
    else if (rl.includes("movie") || rl.includes("film")) analysis.dataset = "movies"
    else if (rl.includes("recipe") || rl.includes("food") || rl.includes("cook")) analysis.dataset = "recipes"
    else if (rl.includes("book") || rl.includes("library")) analysis.dataset = "books"
    else if (rl.includes("game") || rl.includes("gaming")) analysis.dataset = "games"
    else if (rl.includes("product") || rl.includes("shop") || rl.includes("store")) analysis.dataset = "products"
    else if (rl.includes("weather") || rl.includes("sensor") || rl.includes("temperature")) analysis.dataset = "sensor data"
    else if (rl.includes("news") || rl.includes("article")) analysis.dataset = "articles"
    else if (rl.includes("pokemon") || rl.includes("pokémon")) analysis.dataset = "pokemon"

    analysis.textFields = rl.includes("description") || rl.includes("review") || rl.includes("comment") || rl.includes("summary") || rl.includes("text") || rl.includes("genre") || rl.includes("name")

    // Try to detect dataset size from README (e.g. "114,000 tracks", "10000 items")
    const sizeMatch = readme.match(/([\d,]+)\s*(tracks|items|records|rows|movies|books|songs|recipes|products|entries|data points)/i)
    if (sizeMatch) analysis.datasetSize = sizeMatch[1].replace(/,/g, "") + " " + sizeMatch[2]

    // Detect specific fields mentioned
    analysis.mentionedFields = []
    const fieldPatterns = ["popularity", "genre", "rating", "score", "price", "description", "review", "artist", "author", "year", "duration", "category"]
    for (const f of fieldPatterns) {
      if (rl.includes(f)) analysis.mentionedFields.push(f)
    }
  }

  return analysis
}

function getRecommendations(analysis) {
  const recs = []

  // Semantic Search — good for almost any text dataset
  let searchScore = 60
  if (analysis.textFields) searchScore += 20
  if (analysis.dataset) searchScore += 10
  if (analysis.hasApi) searchScore += 5
  recs.push({ name: "Semantic Search", score: Math.min(searchScore, 100), reason: analysis.textFields
    ? `Your dataset has text fields — semantic search lets users find items by meaning instead of exact keywords.`
    : `Works well with any dataset that has text descriptions or titles.` })

  // Content Recommendations
  let recScore = 55
  if (analysis.dataset && ["movies","books","music","games","recipes","products"].includes(analysis.dataset)) recScore += 25
  if (analysis.textFields) recScore += 10
  recs.push({ name: "Content Recommendations", score: Math.min(recScore, 100), reason: analysis.dataset
    ? `"More like this" recommendations are a natural fit for a ${analysis.dataset} dataset.`
    : `Embed items and use cosine similarity for "More like this" recommendations.` })

  // Sentiment Analysis
  let sentScore = 40
  if (analysis.textFields) sentScore += 30
  if (analysis.dataset && ["products","books","movies","music","articles"].includes(analysis.dataset)) sentScore += 15
  recs.push({ name: "Sentiment Analysis", score: Math.min(sentScore, 100), reason: analysis.textFields
    ? `Your text data (descriptions/reviews) can be analyzed for sentiment and visualized with your existing charts.`
    : `Best if your dataset has reviews, comments, or other user-generated text.` })

  // Text Summarization
  let sumScore = 45
  if (analysis.textFields) sumScore += 20
  if (analysis.hasApi) sumScore += 10
  recs.push({ name: "Text Summarization", score: Math.min(sumScore, 100), reason:
    `Use an LLM to generate summaries, descriptions, or insights about items in your dataset.` })

  // Clustering
  let clusterScore = 50
  if (analysis.hasCharts) clusterScore += 15
  if (analysis.textFields) clusterScore += 15
  recs.push({ name: "Clustering & Grouping", score: Math.min(clusterScore, 100), reason: analysis.hasCharts
    ? `You already have visualization components — adding a cluster scatter plot would complement them.`
    : `Auto-group similar items and visualize clusters in a 2D scatter plot.` })

  // RAG
  let ragScore = 50
  if (analysis.textFields) ragScore += 15
  if (analysis.hasApi) ragScore += 10
  if (analysis.hasOpenAI || analysis.hasLangchain) ragScore += 15
  recs.push({ name: "RAG (Q&A)", score: Math.min(ragScore, 100), reason: analysis.hasOpenAI || analysis.hasLangchain
    ? `You already have AI libraries installed — RAG combines retrieval with generation for a chat-based data explorer.`
    : `The most complex option but also the most impressive — a chat interface for your dataset.` })

  return recs.sort((a, b) => b.score - a.score)
}

// ═══════════════════════════════════════════════════════════════
// Tab 5: Plan Your VG Feature (with GitLab + AI Chat)
// ═══════════════════════════════════════════════════════════════
function PlanTab({ apiKey, liveAI }) {
  const [gitlabUrl, setGitlabUrl] = useState("")
  const [gitlabToken, setGitlabToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [manualInfo, setManualInfo] = useState({ framework: "", dataset: "", hasText: false })
  const [useManual, setUseManual] = useState(false)

  // AI Chat state
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const connectGitLab = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGitLabProject(gitlabUrl, gitlabToken || null)
      setProjectData(data)
      const a = analyzeProject(data)
      setAnalysis(a)
      setRecommendations(getRecommendations(a))

      // Auto-start chat with project context
      const introMsg = buildIntroMessage(a, data.project.name)
      setMessages([{ role: "assistant", content: introMsg }])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const applyManual = () => {
    const a = {
      framework: manualInfo.framework || null,
      database: null,
      dataset: manualInfo.dataset || null,
      textFields: manualInfo.hasText,
      hasApi: true,
      hasCharts: true,
      hasOpenAI: false,
      hasLangchain: false,
      files: [],
    }
    setAnalysis(a)
    setRecommendations(getRecommendations(a))
    const introMsg = buildIntroMessage(a, "your project")
    setMessages([{ role: "assistant", content: introMsg }])
  }

  function buildIntroMessage(a, projectName) {
    const parts = [`I've analyzed **${projectName}**! Here's what I found:\n`]
    if (a.language) parts.push(`Language: **${a.language}**`)
    if (a.framework) parts.push(`Framework: **${a.framework}**`)
    if (a.database) parts.push(`Database: **${a.database}**`)
    if (a.dataset) parts.push(`Dataset: **${a.dataset}**${a.datasetSize ? ` (${a.datasetSize})` : ""}`)
    if (a.textFields) parts.push(`Text fields detected — great for embeddings!`)
    if (a.hasCSV) parts.push(`CSV data file included in repo`)
    if (a.hasPandas) parts.push(`pandas installed — good for data preprocessing`)
    if (a.hasOpenAI) parts.push(`OpenAI SDK already installed`)
    if (a.hasLangchain) parts.push(`LangChain already installed`)
    if (a.mentionedFields?.length > 0) parts.push(`Detected fields: ${a.mentionedFields.join(", ")}`)
    parts.push(`\nBased on your stack, I have recommendations for which VG AI feature fits best. Ask me anything — which option to pick, how to implement it in ${a.framework || "your stack"}, architecture questions, or cost concerns!`)
    return parts.join("\n")
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])

    if (!liveAI) {
      // No live AI backend — fall back to canned guided responses
      const response = generateGuidedResponse(userMsg, analysis, recommendations)
      // Simulate typing
      setChatLoading(true)
      await new Promise(r => setTimeout(r, 600))
      setMessages(prev => [...prev, { role: "assistant", content: response }])
      setChatLoading(false)
      return
    }

    // Real OpenAI call with streaming
    setChatLoading(true)
    try {
      const systemPrompt = buildSystemPrompt(analysis, recommendations)
      const allMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg }
      ]

      abortRef.current = new AbortController()
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, apiKey: apiKey || undefined }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `API error: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split("\n").filter(l => l.startsWith("data: "))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ""
            assistantMsg += delta
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: "assistant", content: assistantMsg }
              return updated
            })
          } catch(e) {}
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}. Check your API key and try again.` }])
      }
    }
    setChatLoading(false)
  }

  function buildSystemPrompt(analysis, recs) {
    return `You are an AI engineering tutor helping a university student plan which AI/ML feature to add to their web application for a VG (higher grade) in course 1DV027.

PROJECT CONTEXT:
${analysis ? `- Language: ${analysis.language || "unknown"}
- Framework: ${analysis.framework || "unknown"}
- Database: ${analysis.database || "unknown"}
- Dataset type: ${analysis.dataset || "unknown"}${analysis.datasetSize ? ` (${analysis.datasetSize})` : ""}
- Has text fields: ${analysis.textFields ? "yes" : "unknown"}
- Mentioned data fields: ${analysis.mentionedFields?.join(", ") || "unknown"}
- Has CSV data files: ${analysis.hasCSV ? "yes" : "no"}
- Has pandas: ${analysis.hasPandas ? "yes" : "no"}
- Has scikit-learn: ${analysis.hasScikitLearn ? "yes" : "no"}
- Has Docker setup: ${analysis.hasDockerfile ? "yes" : "no"}
- Existing AI libraries: ${[analysis.hasOpenAI && "OpenAI SDK", analysis.hasLangchain && "LangChain", analysis.hasPinecone && "Pinecone", analysis.hasChroma && "Chroma"].filter(Boolean).join(", ") || "none detected"}` : "No project analysis available."}

AVAILABLE VG OPTIONS (student picks ONE):
1. Semantic Search — natural language queries matched by meaning (needs: embedding model + vector DB)
2. Content-Based Recommendations — "items similar to this one" (needs: embedding model + vector DB)
3. Sentiment Analysis — analyze and visualize text sentiment (needs: LLM API or VADER library)
4. Text Summarization / Generation — LLM-powered summaries (needs: LLM API)
5. Clustering & Grouping — auto-group similar items visually (needs: embedding model + clustering algorithm)
6. RAG — natural language Q&A grounded in their dataset (needs: embedding model + vector DB + LLM API)

${recs ? `TOP RECOMMENDATIONS (based on their project):
${recs.slice(0, 3).map((r, i) => `${i + 1}. ${r.name} (${r.score}% fit) — ${r.reason}`).join("\n")}` : ""}

REQUIREMENTS:
- Must use pre-trained models or APIs (not trained from scratch)
- Must be integrated into their existing web app with a UI
- Must be connected to their actual dataset
- API keys must be stored securely (backend, env vars)

GUIDELINES FOR YOUR RESPONSES:
- Be specific to THEIR project, stack, and dataset
- Give concrete code examples in their framework (${analysis?.framework || "Node.js"}) and language (${analysis?.language || "JavaScript"})
- For Python projects: suggest pip packages (openai, pinecone-client, chromadb, scikit-learn, sentence-transformers)
- For Node.js projects: suggest npm packages (openai, @pinecone-database/pinecone, chromadb, ai from vercel)
- Warn about common pitfalls (API key exposure, cost, latency)
- Keep responses focused and actionable — these are students, not senior engineers
- If they ask about architecture, draw ASCII diagrams
- If they're unsure, help them decide based on their dataset and existing code`
  }

  function generateGuidedResponse(input, analysis, recs) {
    const q = input.toLowerCase()

    if (q.includes("which") || q.includes("recommend") || q.includes("best") || q.includes("should i") || q.includes("pick") || q.includes("choose")) {
      if (!recs) return "I'd need to know more about your project first. What framework are you using, and what kind of dataset do you have?"
      const top = recs[0]
      const runner = recs[1]
      return `Based on your project, I'd recommend **${top.name}** (${top.score}% fit).\n\n${top.reason}\n\nRunner-up: **${runner.name}** (${runner.score}% fit) — ${runner.reason}\n\nWant me to walk you through the implementation steps for either of these?`
    }

    if (q.includes("semantic search") || q.includes("search")) {
      return `**Semantic Search** is a great choice! Here's the plan:\n\n1. Install: \`npm install openai @pinecone-database/pinecone\`\n2. Create an embedding script that processes your dataset items once\n3. Add a \`/api/search\` endpoint to your ${analysis?.framework || "backend"}\n4. Build a search bar component that sends queries and shows ranked results\n\nThe key insight: users type natural language ("romantic comedies from the 90s") and get results by *meaning*, not keywords.\n\nWant to see the code for any of these steps?`
    }

    if (q.includes("rag") || q.includes("chat") || q.includes("q&a") || q.includes("question")) {
      return `**RAG** is the most complex but also most impressive option. It's essentially semantic search + an LLM:\n\n1. First, implement semantic search (embed your dataset, store in vector DB)\n2. When a user asks a question, retrieve the top 5 relevant items\n3. Build a prompt: "Based on these items: [...], answer: ..."\n4. Stream the LLM response to a chat UI\n\nYou'll need both an embedding model AND an LLM API (OpenAI covers both). The hardest part is building a good chat UI with streaming — check out the Vercel AI SDK if you're using ${analysis?.framework || "Next.js"}.\n\nFeel free to ask about any specific step!`
    }

    if (q.includes("sentiment")) {
      return `**Sentiment Analysis** is one of the easiest options!\n\nSimplest approach (no API key needed):\n\`\`\`\npip install vaderSentiment\n\`\`\`\nVADER gives you a compound score (-1 to 1) for any text. Run it on your dataset's text fields, store the scores, then visualize with color-coded items or a distribution chart.\n\nFancier approach: use \`gpt-4o-mini\` to classify sentiment with a prompt. More accurate but costs money.\n\n${analysis?.textFields ? "Your project seems to have text fields — this could work well!" : "Does your dataset have reviews, descriptions, or comments? That's what you'd analyze."}`
    }

    if (q.includes("cluster") || q.includes("group")) {
      return `**Clustering** produces really visual results — perfect for a data visualization app!\n\n1. Embed all items → get vectors\n2. Run K-Means (pick k=5-10 clusters)\n3. Use t-SNE to reduce to 2D coordinates\n4. Render an interactive scatter plot with D3.js or Plotly\n\nPython (scikit-learn) is easiest for the ML part. You can pre-compute clusters and export as JSON for your frontend.\n\nBonus: use an LLM to auto-name each cluster based on the items in it!`
    }

    if (q.includes("recommend") || q.includes("similar") || q.includes("like this")) {
      return `**Content-Based Recommendations** is almost identical to semantic search!\n\nInstead of embedding a *query*, you use an *item's* embedding to find similar items:\n\n1. Same setup: embed your dataset, store in vector DB\n2. Add a "More like this" button on item detail pages\n3. On click: fetch that item's embedding → query vector DB → show results\n\nIt's the same infrastructure as semantic search, so if you're torn between the two, you could even implement both with minimal extra work.\n\n${analysis?.dataset ? `For your ${analysis.dataset} dataset, this would let users discover similar ${analysis.dataset} they might enjoy!` : ""}`
    }

    if (q.includes("cost") || q.includes("expensive") || q.includes("free") || q.includes("money") || q.includes("price")) {
      return `Great question about costs! Here's the breakdown:\n\n**Free options:**\n- Sentiment: VADER library (Python) — completely free, no API needed\n- Clustering: scikit-learn — free, runs locally\n- Ollama: run open-source LLMs locally — free but needs decent hardware\n\n**Very cheap (pennies):**\n- OpenAI Embeddings: $0.02 per 1M tokens — embedding 10,000 items costs ~$0.01\n- gpt-4o-mini: ~$0.15 per 1M input tokens — very affordable for student projects\n- New OpenAI accounts get $5 free credits\n\n**Free tiers for vector DBs:**\n- Pinecone: free starter plan\n- Chroma: free (runs locally)\n- pgvector: free if you already have PostgreSQL`
    }

    if (q.includes("api key") || q.includes("secret") || q.includes("security") || q.includes("safe")) {
      return `API key security — crucial topic!\n\n**Rules:**\n1. NEVER put API keys in frontend code\n2. Store in \`.env\` file (add to \`.gitignore\`!)\n3. Access via \`process.env.OPENAI_API_KEY\` in your backend\n4. ${analysis?.framework === "Next.js" ? "In Next.js, use API routes — they run server-side" : analysis?.framework === "Nuxt" ? "In Nuxt, use server routes in /server/api/" : "Make API calls from your Express/backend server only"}\n\nCheck your git history — if you ever committed a key, rotate it immediately!\n\nFor deployment: use environment variables in your hosting platform (Vercel, Netlify, etc.).`
    }

    if (q.includes("architecture") || q.includes("where") || q.includes("structure") || q.includes("how does it fit")) {
      return `Here's where AI fits in your existing stack:\n\n\`\`\`\nFrontend (${analysis?.framework || "React/Vue"})\n  ├── Search bar / Chat UI / "More like this" button\n  └── Calls your backend API\n          │\nYour Backend\n  ├── /api/search or /api/chat (NEW endpoints)\n  ├── Calls OpenAI API for embeddings/completions\n  ├── Queries vector DB for similar items\n  └── Returns results to frontend\n          │\nNew: Vector DB (Pinecone/Chroma)\n  └── Pre-indexed embeddings of your dataset\n          │\nExisting: Your WT1 API + Database\n  └── Your actual data (unchanged)\n\`\`\`\n\nThe AI layer sits *between* your frontend and your existing API. You're adding new endpoints, not changing existing ones.`
    }

    // Default
    return `That's a great question! Here's what I'd suggest:\n\n${recs ? `For your project, the top options are:\n${recs.slice(0, 3).map((r, i) => `${i + 1}. **${r.name}** — ${r.reason}`).join("\n")}\n\n` : ""}Try asking me about:\n- "Which option should I pick?"\n- "How does RAG work?"\n- "What about costs?"\n- "Where does the AI code go in my architecture?"\n- "How do I keep my API key safe?"\n\n${liveAI ? "" : "Tip: add an OpenAI API key in the header bar for more detailed, personalized answers powered by GPT-4o-mini!"}`
  }

  return (
    <div className="space-y-6">
      {/* Project Connection */}
      {!analysis ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-1">Connect your project</h3>
            <p className="text-sm text-amber-800">
              Paste your GitLab repo URL and I'll analyze your tech stack, dataset, and existing code to recommend the best VG AI feature for your app.
            </p>
          </div>

          {!useManual ? (
            <div className="bg-white border rounded-lg p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Repository URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gitlabUrl}
                    onChange={e => setGitlabUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && gitlabUrl.trim() && connectGitLab()}
                    placeholder="https://gitlab.lnu.se/1dv027/student/username/assignment-wt2"
                    className="flex-1 px-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={connectGitLab}
                    disabled={loading || !gitlabUrl.trim()}
                    className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium disabled:opacity-50"
                  >
                    {loading ? "Analyzing..." : "Connect"}
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  <span>{showToken ? "▾" : "▸"}</span>
                  <span>{gitlabToken ? "Token configured" : "Private repo? Add a GitLab access token"}</span>
                  {gitlabToken && <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" />}
                </button>
                {showToken && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="password"
                      value={gitlabToken}
                      onChange={e => setGitlabToken(e.target.value)}
                      placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg space-y-1">
                      <p className="font-medium text-gray-700">How to create a token:</p>
                      <p>1. Go to <strong>gitlab.lnu.se/-/user_settings/personal_access_tokens</strong></p>
                      <p>2. Name: anything (e.g. "AI demo") — Expiration: tomorrow is fine</p>
                      <p>3. Scope: check <strong>read_api</strong> only</p>
                      <p>4. Click "Create personal access token" and paste it above</p>
                      <p className="text-amber-600 mt-1">Token is kept in memory only and forwarded once to this app's backend, which calls the GitLab API on your behalf.</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg whitespace-pre-wrap">
                  {error}
                </div>
              )}
              <button onClick={() => setUseManual(true)} className="text-sm text-amber-600 hover:text-amber-800 underline">
                Skip GitLab — enter project details manually
              </button>
            </div>
          ) : (
            <div className="bg-white border rounded-lg p-5 space-y-4">
              <h4 className="font-semibold text-gray-700">Tell me about your project</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Framework</label>
                  <select
                    value={manualInfo.framework}
                    onChange={e => setManualInfo(p => ({ ...p, framework: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="Next.js">Next.js</option>
                    <option value="Nuxt">Nuxt</option>
                    <option value="React">React + Express</option>
                    <option value="Vue">Vue + Express</option>
                    <option value="Express">Express (API only)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Dataset type</label>
                  <select
                    value={manualInfo.dataset}
                    onChange={e => setManualInfo(p => ({ ...p, dataset: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="movies">Movies / TV shows</option>
                    <option value="books">Books / Literature</option>
                    <option value="music">Music / Songs</option>
                    <option value="recipes">Recipes / Food</option>
                    <option value="games">Games</option>
                    <option value="products">Products / E-commerce</option>
                    <option value="articles">Articles / News</option>
                    <option value="sensor data">Sensor / IoT data</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={manualInfo.hasText}
                  onChange={e => setManualInfo(p => ({ ...p, hasText: e.target.checked }))}
                  className="rounded"
                />
                My dataset has text fields (descriptions, reviews, comments, etc.)
              </label>
              <div className="flex gap-2">
                <button onClick={applyManual} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">
                  Analyze
                </button>
                <button onClick={() => setUseManual(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">
                  Back to GitLab URL
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Project Analysis Summary */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Project Analysis</h3>
              <button
                onClick={() => { setAnalysis(null); setProjectData(null); setRecommendations(null); setMessages([]) }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >Change project</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.language && (
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                  {analysis.language}
                </span>
              )}
              {analysis.framework && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {analysis.framework}
                </span>
              )}
              {analysis.database && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {analysis.database}
                </span>
              )}
              {analysis.dataset && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Dataset: {analysis.dataset}{analysis.datasetSize ? ` (${analysis.datasetSize})` : ""}
                </span>
              )}
              {analysis.textFields && (
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                  Has text fields
                </span>
              )}
              {analysis.hasCSV && (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                  CSV data included
                </span>
              )}
              {analysis.hasPandas && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  pandas
                </span>
              )}
              {analysis.hasOpenAI && (
                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  OpenAI SDK
                </span>
              )}
              {analysis.hasDockerfile && (
                <span className="text-xs px-2 py-1 bg-sky-100 text-sky-700 rounded-full">
                  Dockerized
                </span>
              )}
              {analysis.mentionedFields?.length > 0 && (
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  Fields: {analysis.mentionedFields.slice(0, 4).join(", ")}
                </span>
              )}
              {projectData?.tree && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {projectData.tree.filter(f => f.type === "blob").length} files
                </span>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Recommended VG options for your project</h3>
              <div className="space-y-2">
                {recommendations.slice(0, 4).map((rec, i) => (
                  <div key={rec.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: i === 0 ? "#22c55e" : i === 1 ? "#3b82f6" : "#94a3b8" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{rec.name}</div>
                      <p className="text-xs text-gray-500 mt-0.5">{rec.reason}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-sm font-bold" style={{ color: `hsl(${rec.score * 1.2}, 50%, 40%)` }}>
                        {rec.score}%
                      </div>
                      <div className="text-xs text-gray-400">fit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Chat */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
              <h3 className="font-semibold text-white text-sm">
                AI Planning Assistant
                {liveAI
                  ? <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">GPT-4o-mini</span>
                  : <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Guided mode — add API key for live AI</span>}
              </h3>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-white border text-gray-800"
                  }`}>
                    {msg.content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <strong key={j}>{part.slice(2, -2)}</strong>
                        : part.split(/(`[^`]+`)/g).map((seg, k) =>
                            seg.startsWith("`") && seg.endsWith("`")
                              ? <code key={k} className="bg-gray-100 text-pink-600 px-1 rounded text-xs">{seg.slice(1, -1)}</code>
                              : seg
                          )
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-lg px-4 py-2.5 text-sm text-gray-400">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t bg-white">
              <div className="flex flex-wrap gap-2 mb-2">
                {messages.length <= 1 && [
                  "Which option should I pick?",
                  "How much does it cost?",
                  "Show me the architecture",
                  "How do I keep my API key safe?"
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setChatInput(q); }}
                    className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-indigo-50 hover:text-indigo-700 text-gray-600"
                  >{q}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Ask about your VG feature..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={sendMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                >Send</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Main App
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: "embeddings", label: "Embeddings", icon: "🔢" },
  { id: "search", label: "Semantic Search", icon: "🔍" },
  { id: "vectors", label: "Vector Space", icon: "📊" },
  { id: "rag", label: "RAG Pipeline", icon: "🤖" },
  { id: "plan", label: "Plan Your Feature", icon: "🛠" },
]

const TAB_COMPONENTS = {
  embeddings: EmbeddingsTab,
  search: SemanticSearchTab,
  vectors: VectorSpaceTab,
  rag: RAGTab,
}

export default function AIEngineeringDemo() {
  const [activeTab, setActiveTab] = useState("embeddings")
  const [apiKey, setApiKey] = useState("")
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [hasServerKey, setHasServerKey] = useState(false)

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg?.hasServerKey) setHasServerKey(true) })
      .catch(() => { /* backend not reachable — fine, falls back to client key */ })
  }, [])

  const liveAI = Boolean(apiKey) || hasServerKey
  const ActiveComponent = activeTab === "plan" ? null : TAB_COMPONENTS[activeTab]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">AI Engineering for Web Developers</h1>
              <p className="text-indigo-100 mt-1">
                1DV027 — Interactive demo: embeddings, semantic search, RAG, and planning your VG feature
              </p>
            </div>
            <div className="flex-shrink-0">
              {hasServerKey ? (
                <span className="text-xs px-3 py-1.5 rounded-full border bg-green-500/20 border-green-300/50 text-green-100">
                  Server key configured
                </span>
              ) : !showKeyInput ? (
                <button
                  onClick={() => setShowKeyInput(true)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    apiKey
                      ? "bg-green-500/20 border-green-300/50 text-green-100"
                      : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {apiKey ? "API Key Connected" : "Add OpenAI Key"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-48 px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50"
                  />
                  <button onClick={() => setShowKeyInput(false)} className="text-xs text-white/60 hover:text-white">
                    {apiKey ? "Done" : "Close"}
                  </button>
                </div>
              )}
              {showKeyInput && (
                <p className="text-xs text-white/40 mt-1 text-right">
                  Stored in memory only — never sent anywhere except OpenAI
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VG Feature Options Overview */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">VG Feature Options — pick one</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: "Semantic Search", icon: "🔍", tech: ["Embeddings", "Vector DB"], desc: "Search by meaning, not keywords" },
              { name: "Recommendations", icon: "🎯", tech: ["Embeddings", "Vector DB"], desc: "\"Items similar to this one\"" },
              { name: "Sentiment Analysis", icon: "💬", tech: ["LLM API"], desc: "Detect and visualize text sentiment" },
              { name: "Summarization", icon: "📝", tech: ["LLM API"], desc: "LLM-powered text summaries" },
              { name: "Clustering", icon: "🗂", tech: ["Embeddings", "Clustering"], desc: "Auto-group similar items" },
              { name: "RAG", icon: "🤖", tech: ["Embeddings", "Vector DB", "LLM API"], desc: "Q&A grounded in your dataset" },
            ].map(opt => (
              <div key={opt.name} className="border rounded-lg p-3 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{opt.icon}</span>
                  <span className="font-medium text-sm text-gray-800">{opt.name}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{opt.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {opt.tech.map(t => (
                    <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      t === "Embeddings" ? "bg-purple-100 text-purple-700" :
                      t === "Vector DB" ? "bg-blue-100 text-blue-700" :
                      t === "LLM API" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-gray-400">
            <span><span className="inline-block w-2 h-2 rounded-full bg-purple-200 mr-1" />Needs embeddings</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-200 mr-1" />Needs vector storage</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-amber-200 mr-1" />Needs LLM API calls</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {activeTab === "plan" ? <PlanTab apiKey={apiKey} liveAI={liveAI} /> : ActiveComponent && <ActiveComponent />}
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-6 py-4 text-center text-xs text-gray-400 border-t mt-8">
        1DV027 Web as an Application Platform — AI Engineering Demo
        <br />
        Embeddings use a simplified 8-dimensional model for demonstration. Real models use 1,536+ dimensions.
      </div>
    </div>
  )
}
