-- TASK-001 (DOWN)
-- Roll back Meeting Session + note review metadata schema

BEGIN;

-- Drop indices
DROP INDEX IF EXISTS idx_meeting_sessions_status;
DROP INDEX IF EXISTS idx_sticky_notes_needs_review;
DROP INDEX IF EXISTS idx_sticky_notes_meeting_session_id;

-- Drop FKs
ALTER TABLE IF EXISTS note_reclassifications
  DROP CONSTRAINT IF EXISTS fk_note_reclassifications_note;

ALTER TABLE IF EXISTS sticky_notes
  DROP CONSTRAINT IF EXISTS fk_sticky_notes_meeting_session;

-- Drop note_reclassifications table
DROP TABLE IF EXISTS note_reclassifications;

-- Drop sticky_notes columns
ALTER TABLE IF EXISTS sticky_notes
  DROP COLUMN IF EXISTS classification_confidence,
  DROP COLUMN IF EXISTS needs_review,
  DROP COLUMN IF EXISTS meeting_session_id;

-- Drop meeting_sessions table
DROP TABLE IF EXISTS meeting_sessions;

COMMIT;
