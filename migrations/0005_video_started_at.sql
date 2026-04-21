-- Track when an animation was requested (for daily rate limiting)
ALTER TABLE journal_entries ADD COLUMN video_started_at REAL;
