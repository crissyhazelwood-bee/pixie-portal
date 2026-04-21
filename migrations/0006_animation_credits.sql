-- Add animation credits to users (everyone starts with 3)
ALTER TABLE users ADD COLUMN animation_credits INTEGER DEFAULT 3;
