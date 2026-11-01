-- Member profile schema only. Authentication and password handling are intentionally
-- not implemented in this project because the requested scope excludes a backend.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL CHECK (length(trim(nickname)) BETWEEN 2 AND 40),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE
    CHECK (length(trim(email)) BETWEEN 3 AND 254),
  gender TEXT NOT NULL
    CHECK (gender IN ('female', 'male', 'undisclosed')),
  home_address TEXT NOT NULL CHECK (length(trim(home_address)) BETWEEN 1 AND 300),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);