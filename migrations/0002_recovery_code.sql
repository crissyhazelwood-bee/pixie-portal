-- Add recovery code support for password recovery without email
ALTER TABLE users ADD COLUMN recovery_code_hash TEXT;
