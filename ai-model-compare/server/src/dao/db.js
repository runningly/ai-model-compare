import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db = new Database(path.join(dataDir, 'models.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS models (
    id             TEXT PRIMARY KEY,
    model_name     TEXT NOT NULL,
    vendor         TEXT NOT NULL,
    context_length INTEGER NOT NULL,
    max_output     INTEGER NOT NULL,
    price_list     TEXT NOT NULL,
    features       TEXT NOT NULL,
    purchase_url   TEXT NOT NULL,
    free           INTEGER DEFAULT 0,
    remark         TEXT
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id    TEXT NOT NULL,
    model_id   TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    PRIMARY KEY (user_id, model_id)
  )
`)
