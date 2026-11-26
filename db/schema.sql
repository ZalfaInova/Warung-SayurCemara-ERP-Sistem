-- Skema Cloudflare D1 untuk Warung Sayur Cemara
-- Jalankan di: Dashboard > D1 > warung-sayurcemara-db > Console
-- (atau `wrangler d1 execute warung-sayurcemara-db --remote --file=db/schema.sql`)

CREATE TABLE IF NOT EXISTS app_state (
  id         TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  revision   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS state_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  state_id   TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_state_history_state
  ON state_history(state_id, id DESC);
