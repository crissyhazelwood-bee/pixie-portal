-- Add video generation columns to journal entries
ALTER TABLE journal_entries ADD COLUMN video_url TEXT;
ALTER TABLE journal_entries ADD COLUMN video_prediction_id TEXT;
ALTER TABLE journal_entries ADD COLUMN video_status TEXT DEFAULT 'idle';
