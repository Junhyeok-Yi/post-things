-- TASK-001 (UP)
-- Meeting Session + note review metadata schema

BEGIN;

-- 1) Meeting sessions
CREATE TABLE IF NOT EXISTS meeting_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) sticky_notes extensions (safe additive changes)
ALTER TABLE sticky_notes
  ADD COLUMN IF NOT EXISTS meeting_session_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS classification_confidence DOUBLE PRECISION NULL;

-- Optional FK (deferred integrity from now on)
ALTER TABLE sticky_notes
  ADD CONSTRAINT IF NOT EXISTS fk_sticky_notes_meeting_session
  FOREIGN KEY (meeting_session_id)
  REFERENCES meeting_sessions(id)
  ON DELETE SET NULL;

-- 3) Reclassification audit trail
CREATE TABLE IF NOT EXISTS note_reclassifications (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  from_category TEXT NULL,
  to_category TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ai', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional FK to sticky_notes
ALTER TABLE note_reclassifications
  ADD CONSTRAINT IF NOT EXISTS fk_note_reclassifications_note
  FOREIGN KEY (note_id)
  REFERENCES sticky_notes(id)
  ON DELETE CASCADE;

-- 4) Indices
CREATE INDEX IF NOT EXISTS idx_sticky_notes_meeting_session_id
  ON sticky_notes(meeting_session_id);

CREATE INDEX IF NOT EXISTS idx_sticky_notes_needs_review
  ON sticky_notes(needs_review);

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_status
  ON meeting_sessions(status);

COMMIT;
