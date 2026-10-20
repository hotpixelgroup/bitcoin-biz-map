CREATE TABLE IF NOT EXISTS intake_records (
  pathname TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS intake_records_age ON intake_records(created_at);
