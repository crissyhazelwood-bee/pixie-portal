-- Pixie Portal schema
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    bio TEXT DEFAULT '',
    avatar_emoji TEXT DEFAULT '✦',
    created_at REAL
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    mood TEXT DEFAULT 'neutral',
    created_at REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game TEXT NOT NULL,
    score INTEGER NOT NULL,
    details TEXT DEFAULT '{}',
    created_at REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
