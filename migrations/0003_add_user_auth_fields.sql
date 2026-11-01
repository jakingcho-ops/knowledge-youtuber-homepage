ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN password_salt TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN password_iterations INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN session_token_hash TEXT;
ALTER TABLE users ADD COLUMN session_expires_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_session_token_hash_unique
  ON users(session_token_hash)
  WHERE session_token_hash IS NOT NULL;