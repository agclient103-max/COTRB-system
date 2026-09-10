-- COTRB Church Management System — Initial Schema
-- Every module's real backing table, plus the audit log and notification
-- preferences that used to live only in the browser's IndexedDB.
--
-- Numbering strategy (§5.3, now made real): each module has its own Postgres
-- SEQUENCE. sequence_number is assigned server-side, atomically, at insert
-- time — this is the authoritative source the frontend's "Pending sync"
-- placeholder was always waiting for.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared trigger: keeps updated_at current on every UPDATE, on every table.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE SEQUENCE documents_seq START 1;

CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  local_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sequence_number TEXT UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  ministry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  file_key TEXT,
  file_name TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_by_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_ministry ON documents(ministry);
CREATE INDEX idx_documents_dedup ON documents(lower(title), ministry);

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PERSONNEL
-- ============================================================
CREATE SEQUENCE personnel_seq START 1;

CREATE TABLE personnel (
  id BIGSERIAL PRIMARY KEY,
  local_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sequence_number TEXT UNIQUE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  ministry TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_personnel_category ON personnel(category);
CREATE INDEX idx_personnel_status ON personnel(status);
CREATE INDEX idx_personnel_dedup ON personnel(lower(name));

CREATE TRIGGER trg_personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- MINISTRIES
-- ============================================================
CREATE SEQUENCE ministries_seq START 1;

CREATE TABLE ministries (
  id BIGSERIAL PRIMARY KEY,
  local_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sequence_number TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lead TEXT NOT NULL DEFAULT '— Not yet assigned —',
  member_count INTEGER,
  schedule TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT NOT NULL DEFAULT '',
  created_by_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ministries_category ON ministries(category);
CREATE INDEX idx_ministries_dedup ON ministries(lower(name));

CREATE TRIGGER trg_ministries_updated_at
  BEFORE UPDATE ON ministries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- EVENTS (+ attendees as a real child table, not a JSON array)
-- ============================================================
CREATE SEQUENCE events_seq START 1;

CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  local_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sequence_number TEXT UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  ministry TEXT NOT NULL,
  when_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Upcoming',
  capacity INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_by_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dedup ON events(lower(title));

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE event_attendees (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);

-- ============================================================
-- FINANCIAL
-- ============================================================
CREATE SEQUENCE financial_seq START 1;

CREATE TABLE financial_transactions (
  id BIGSERIAL PRIMARY KEY,
  local_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sequence_number TEXT UNIQUE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
  category TEXT NOT NULL,
  ministry TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Recorded',
  notes TEXT NOT NULL DEFAULT '',
  created_by_id TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_type ON financial_transactions(type);
CREATE INDEX idx_financial_date ON financial_transactions(date);
CREATE INDEX idx_financial_dedup ON financial_transactions(date, lower(description));

CREATE TRIGGER trg_financial_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SAVED REPORTS
-- ============================================================
CREATE SEQUENCE reports_seq START 1;

CREATE TABLE saved_reports (
  id BIGSERIAL PRIMARY KEY,
  local_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  sequence_number TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_by_id TEXT,
  created_by_name TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_reports_dedup ON saved_reports(lower(name));

CREATE TRIGGER trg_saved_reports_updated_at
  BEFORE UPDATE ON saved_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AUDIT LOG — every create/update/merge/delete across every module.
-- user_id references a Netlify Identity user (lives outside Postgres), so
-- it's plain text, not a foreign key. user_name/user_role are snapshotted
-- at write time so history stays readable even if an account is later
-- removed from Identity.
-- ============================================================
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'merged', 'deleted')),
  module_label TEXT NOT NULL,
  record_label TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_timestamp ON audit_log("timestamp" DESC);

-- ============================================================
-- NOTIFICATION PREFERENCES — per Identity user, replacing the old
-- localStorage-per-mock-account version.
-- ============================================================
CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY,
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
