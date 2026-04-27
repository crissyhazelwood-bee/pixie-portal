-- Server-backed Pixie state, memory controls, events, and generation job scaffolding.

CREATE TABLE IF NOT EXISTS portal_players (
    user_id INTEGER PRIMARY KEY,
    points INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_daily_at REAL NOT NULL DEFAULT 0,
    garden TEXT NOT NULL DEFAULT '{}',
    plot TEXT NOT NULL DEFAULT '[]',
    placed_json TEXT NOT NULL DEFAULT '[]',
    created_at REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pixie_memory_state (
    user_id INTEGER PRIMARY KEY,
    disabled INTEGER NOT NULL DEFAULT 0,
    memory_json TEXT NOT NULL DEFAULT '{}',
    updated_at REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pixie_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_type TEXT NOT NULL,
    source TEXT DEFAULT '',
    payload TEXT DEFAULT '{}',
    created_at REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pixie_events_user_created
    ON pixie_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pixie_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_json TEXT DEFAULT '{}',
    equipped INTEGER NOT NULL DEFAULT 0,
    created_at REAL,
    updated_at REAL,
    UNIQUE(user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pixie_inventory_user_type
    ON pixie_inventory(user_id, item_type);

CREATE TABLE IF NOT EXISTS generation_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_type TEXT NOT NULL,
    provider TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'queued',
    cost INTEGER NOT NULL DEFAULT 0,
    prompt TEXT DEFAULT '',
    result_url TEXT DEFAULT '',
    external_id TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    created_at REAL,
    updated_at REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_created
    ON generation_jobs(user_id, created_at DESC);
