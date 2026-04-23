-- Migration 0008: add appearance column to users
ALTER TABLE users ADD COLUMN appearance TEXT;
