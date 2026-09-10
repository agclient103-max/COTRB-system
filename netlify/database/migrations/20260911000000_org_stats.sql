-- Org-wide figures that have no natural tracking table of their own (total
-- congregation membership, attendance, annual budget) — previously hardcoded
-- client-side, now a real editable row so they can be updated from Settings
-- without a code change or redeploy. Single-row table, enforced by the
-- id = 1 check. Seeded with the real current figures already shown in the
-- app, so nothing is lost or reset by this migration.

CREATE TABLE org_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_members INTEGER NOT NULL DEFAULT 0,
  attendance_avg INTEGER NOT NULL DEFAULT 0,
  attendance_peak INTEGER NOT NULL DEFAULT 0,
  annual_budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
  updated_by_id TEXT,
  updated_by_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_org_stats_updated_at
  BEFORE UPDATE ON org_stats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO org_stats (id, total_members, attendance_avg, attendance_peak, annual_budget, updated_by_name)
VALUES (1, 450, 285, 360, 1260000000, 'System Seed');
