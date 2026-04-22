-- Security hardening: fixes for BUG-01, BUG-05, BUG-06, BUG-07

-- BUG-06: session version — lets us invalidate all sessions on password reset/recovery
ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;

-- BUG-05: last free animation timestamp — enables atomic daily-limit enforcement
ALTER TABLE users ADD COLUMN last_free_animation_at REAL;

-- BUG-01: processed webhook events — prevents duplicate credit grants on Stripe retries
CREATE TABLE IF NOT EXISTS processed_webhook_events (
    event_id TEXT PRIMARY KEY,
    processed_at REAL NOT NULL
);

-- BUG-07: attempt counter on reset tokens — enables rate limiting against brute force
ALTER TABLE password_reset_tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
