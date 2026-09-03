import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { applyAction, migrateStore } from '../shared/store.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PORT = Number(process.env.PORT) || 65080
const isProd = process.env.NODE_ENV === 'production'
const STEWARD_TOKEN = process.env.STEWARD_TOKEN || (isProd ? '' : 'dev-token')
const DB_PATH = path.join(ROOT, 'db', 'shop-list.json')
const DIST_PATH = path.join(ROOT, 'dist')

if (!STEWARD_TOKEN) {
  console.error('STEWARD_TOKEN is required in production')
  process.exit(1)
}

if (!process.env.STEWARD_TOKEN && !isProd) {
  console.warn('STEWARD_TOKEN is unset; using dev-token')
}

function loadStore() {
  if (!fs.existsSync(DB_PATH)) {
    const store = migrateStore(null)
    fs.outputJSONSync(DB_PATH, store, { spaces: 2 })
    return store
  }
  const raw = fs.readJSONSync(DB_PATH)
  const store = migrateStore(raw)
  fs.outputJSONSync(DB_PATH, store, { spaces: 2 })
  return store
}

function persist(store) {
  fs.outputJSONSync(DB_PATH, store, { spaces: 2 })
}

let STORE = loadStore()

const app = express()
app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: false,
}))
app.use(express.json({ limit: '100kb' }))
app.use('/api', rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
}))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

function requireToken(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token || token !== STEWARD_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}

app.get('/api/state', requireToken, (_req, res) => {
  res.json(STORE)
})

app.post('/api/state', requireToken, (req, res) => {
  const { action, payload } = req.body || {}
  const result = applyAction(STORE, action, payload)
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error })
  }
  STORE = result.store
  persist(STORE)
  res.json(STORE)
})

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(DIST_PATH, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'invalid json' })
  }
  console.error(err)
  res.status(500).json({ error: 'internal error' })
})

const server = app.listen(PORT, '0.0.0.0')
server.on('listening', () => {
  console.log(`Listen ${PORT} on 0.0.0.0`)
})
server.on('error', (err) => {
  console.error(err)
  process.exit(1)
})
