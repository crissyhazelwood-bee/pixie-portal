-- Current schema — reflects all applied migrations (0001 through 0007).
-- To bootstrap a fresh D1 database: apply each migrations/000N_*.sql file in order.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  recovery_code_hash TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_emoji TEXT,
  fairy_purchased INTEGER DEFAULT 0,
  animation_credits INTEGER DEFAULT 3,
  session_version INTEGER NOT NULL DEFAULT 0,
  last_free_animation_at REAL,
  created_at REAL
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  video_prediction_id TEXT,
  video_url TEXT,
  video_status TEXT DEFAULT 'idle',
  video_started_at REAL,
  created_at REAL
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game TEXT NOT NULL,
  score INTEGER NOT NULL,
  details TEXT,
  created_at REAL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at REAL NOT NULL,
  used INTEGER DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at REAL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at REAL NOT NULL
);
