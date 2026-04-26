-- Runtime columns used by current app routes.
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN poem_date TEXT;
ALTER TABLE journal_entries ADD COLUMN is_public INTEGER DEFAULT 0;
