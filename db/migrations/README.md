# DB Migrations (Manual SQL)

This project currently uses SQL-file based manual migrations for Supabase SQL Editor.

## TASK-001
- `2026-03-02_task001_meeting_schema_up.sql`
- `2026-03-02_task001_meeting_schema_down.sql`

### Apply (UP)
1. Open Supabase → SQL Editor → New query
2. Paste `*_up.sql`
3. Run and verify success

### Rollback (DOWN)
1. Open Supabase → SQL Editor → New query
2. Paste `*_down.sql`
3. Run and verify success

## Verification checklist
- `meeting_sessions` table exists
- `sticky_notes` has new columns
- `note_reclassifications` table exists
- indices exist for `meeting_session_id`, `needs_review`, `status`
