-- =============================================================================
-- Radya CRM — Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================

-- ── Trigger: auto-update updated_at ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── users ─────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            uuid REFERENCES auth.users PRIMARY KEY,
  full_name     text NOT NULL,
  email         text NOT NULL UNIQUE,
  role          text NOT NULL DEFAULT 'sales'
                  CHECK (role IN ('admin', 'sales', 'viewer')),
  avatar_url    text,
  is_active     boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Helper: check if current user is admin (defined after users table) ────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ── pipelines ─────────────────────────────────────────────────────────────────

CREATE TABLE pipelines (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── pipeline_stages ───────────────────────────────────────────────────────────

CREATE TABLE pipeline_stages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id         uuid NOT NULL REFERENCES pipelines ON DELETE CASCADE,
  name                text NOT NULL,
  order_index         integer NOT NULL,
  default_probability integer NOT NULL DEFAULT 50
                        CHECK (default_probability BETWEEN 0 AND 100),
  color               text,
  is_won_stage        boolean NOT NULL DEFAULT false,
  is_lost_stage       boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── tags ──────────────────────────────────────────────────────────────────────

CREATE TABLE tags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  color        text NOT NULL DEFAULT '#6366f1',
  entity_types text[] NOT NULL DEFAULT '{}',
  created_by   uuid REFERENCES users,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── companies ─────────────────────────────────────────────────────────────────

CREATE TABLE companies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  industry         text,
  company_size     text CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  website          text,
  phone            text,
  email_domain     text,
  address_city     text,
  address_province text,
  address_country  text NOT NULL DEFAULT 'Indonesia',
  logo_url         text,
  owner_id         uuid REFERENCES users,
  annual_revenue   numeric,
  custom_fields    jsonb NOT NULL DEFAULT '{}',
  is_archived      boolean NOT NULL DEFAULT false,
  created_by       uuid REFERENCES users,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── contacts ──────────────────────────────────────────────────────────────────

CREATE TABLE contacts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       text NOT NULL,
  last_name        text NOT NULL,
  email            text,
  phone_primary    text,
  phone_secondary  text,
  whatsapp         text,
  job_title        text,
  department       text,
  company_id       uuid REFERENCES companies,
  owner_id         uuid REFERENCES users,
  lead_source      text,
  linkedin_url     text,
  avatar_url       text,
  custom_fields    jsonb NOT NULL DEFAULT '{}',
  is_archived      boolean NOT NULL DEFAULT false,
  created_by       uuid REFERENCES users,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── leads ─────────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text NOT NULL,
  status             text NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'contacted', 'qualified', 'disqualified', 'converted')),
  contact_id         uuid REFERENCES contacts,
  company_id         uuid REFERENCES companies,
  contact_name       text,
  contact_phone      text,
  contact_email      text,
  lead_source        text,
  estimated_value    numeric,
  owner_id           uuid REFERENCES users,
  priority           text CHECK (priority IN ('low', 'medium', 'high')),
  last_contacted_at  timestamptz,
  next_follow_up_at  date,
  custom_fields      jsonb NOT NULL DEFAULT '{}',
  is_archived        boolean NOT NULL DEFAULT false,
  converted_at       timestamptz,
  converted_deal_id  uuid,
  created_by         uuid REFERENCES users,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── deals ─────────────────────────────────────────────────────────────────────

CREATE TABLE deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  pipeline_id         uuid REFERENCES pipelines,
  stage_id            uuid REFERENCES pipeline_stages,
  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'won', 'lost', 'on_hold')),
  value               numeric NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'IDR',
  probability         integer NOT NULL DEFAULT 50
                        CHECK (probability BETWEEN 0 AND 100),
  contact_id          uuid REFERENCES contacts,
  company_id          uuid REFERENCES companies,
  owner_id            uuid REFERENCES users,
  expected_close_date date,
  actual_close_date   date,
  lost_reason         text,
  lead_source         text,
  custom_fields       jsonb NOT NULL DEFAULT '{}',
  stage_changed_at    timestamptz,
  is_archived         boolean NOT NULL DEFAULT false,
  created_by          uuid REFERENCES users,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── tasks ─────────────────────────────────────────────────────────────────────

CREATE TABLE tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  entity_type  text NOT NULL
                 CHECK (entity_type IN ('lead', 'deal', 'contact', 'company')),
  entity_id    uuid NOT NULL,
  assignee_id  uuid REFERENCES users,
  created_by   uuid REFERENCES users,
  due_date     date,
  due_time     time,
  priority     text CHECK (priority IN ('low', 'medium', 'high')),
  status       text NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'completed', 'cancelled')),
  completed_at timestamptz,
  type         text CHECK (type IN ('call', 'whatsapp', 'meeting', 'email', 'follow_up', 'other')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── notes ─────────────────────────────────────────────────────────────────────

CREATE TABLE notes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body                text NOT NULL,
  entity_type         text NOT NULL
                        CHECK (entity_type IN ('lead', 'deal', 'contact', 'company')),
  entity_id           uuid NOT NULL,
  author_id           uuid REFERENCES users,
  mentioned_user_ids  uuid[] NOT NULL DEFAULT '{}',
  is_pinned           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── comments ──────────────────────────────────────────────────────────────────

CREATE TABLE comments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body                text NOT NULL,
  entity_type         text NOT NULL
                        CHECK (entity_type IN ('lead', 'deal', 'contact', 'company')),
  entity_id           uuid NOT NULL,
  parent_comment_id   uuid REFERENCES comments,
  author_id           uuid REFERENCES users,
  mentioned_user_ids  uuid[] NOT NULL DEFAULT '{}',
  is_edited           boolean NOT NULL DEFAULT false,
  is_deleted          boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── activity_log ──────────────────────────────────────────────────────────────

CREATE TABLE activity_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL,
  entity_id     uuid NOT NULL,
  actor_id      uuid REFERENCES users,
  action        text NOT NULL,
  field_changed text,
  old_value     text,
  new_value     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES users,
  type         text NOT NULL,
  entity_type  text,
  entity_id    uuid,
  body         text NOT NULL,
  is_read      boolean NOT NULL DEFAULT false,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

-- ── users policies ────────────────────────────────────────────────────────────

CREATE POLICY "users_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_update_own_or_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR is_admin());

-- ── pipelines / pipeline_stages / tags ───────────────────────────────────────

CREATE POLICY "pipelines_select_authenticated"
  ON pipelines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pipelines_write_admin"
  ON pipelines FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "pipeline_stages_select_authenticated"
  ON pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pipeline_stages_write_admin"
  ON pipeline_stages FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "tags_select_authenticated"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tags_write_admin"
  ON tags FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── companies policies ────────────────────────────────────────────────────────

CREATE POLICY "companies_select_authenticated"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "companies_insert_non_viewer"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "companies_update_owner_or_admin"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "companies_delete_owner_or_admin"
  ON companies FOR DELETE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── contacts policies ─────────────────────────────────────────────────────────

CREATE POLICY "contacts_select_authenticated"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "contacts_insert_non_viewer"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "contacts_update_owner_or_admin"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "contacts_delete_owner_or_admin"
  ON contacts FOR DELETE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── leads policies ────────────────────────────────────────────────────────────

CREATE POLICY "leads_select_authenticated"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "leads_insert_non_viewer"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "leads_update_owner_or_admin"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "leads_delete_owner_or_admin"
  ON leads FOR DELETE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── deals policies ────────────────────────────────────────────────────────────

CREATE POLICY "deals_select_authenticated"
  ON deals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "deals_insert_non_viewer"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "deals_update_owner_or_admin"
  ON deals FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "deals_delete_owner_or_admin"
  ON deals FOR DELETE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── tasks policies ────────────────────────────────────────────────────────────

CREATE POLICY "tasks_select_authenticated"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert_non_viewer"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "tasks_update_assignee_or_admin"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    (assignee_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "tasks_delete_assignee_or_admin"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    (assignee_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── notes policies ────────────────────────────────────────────────────────────

CREATE POLICY "notes_select_authenticated"
  ON notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "notes_insert_non_viewer"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "notes_update_author_or_admin"
  ON notes FOR UPDATE
  TO authenticated
  USING (
    (author_id = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "notes_delete_author_or_admin"
  ON notes FOR DELETE
  TO authenticated
  USING (
    (author_id = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── comments policies ─────────────────────────────────────────────────────────

CREATE POLICY "comments_select_authenticated"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "comments_insert_non_viewer"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "comments_update_author_or_admin"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    (author_id = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "comments_delete_author_or_admin"
  ON comments FOR DELETE
  TO authenticated
  USING (
    (author_id = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── activity_log policies ─────────────────────────────────────────────────────

CREATE POLICY "activity_log_select_actor_or_admin"
  ON activity_log FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid() OR is_admin());

CREATE POLICY "activity_log_insert_authenticated"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── notifications policies ────────────────────────────────────────────────────

CREATE POLICY "notifications_select_recipient_or_admin"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid() OR is_admin());

CREATE POLICY "notifications_update_recipient"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- =============================================================================
-- Seed Data — Default Pipeline
-- =============================================================================

DO $$
DECLARE
  pipeline_id uuid;
BEGIN
  INSERT INTO pipelines (name, is_default)
  VALUES ('Sales Pipeline', true)
  RETURNING id INTO pipeline_id;

  INSERT INTO pipeline_stages (pipeline_id, name, order_index, default_probability, color, is_won_stage, is_lost_stage)
  VALUES
    (pipeline_id, 'Prospecting',  1, 20,  '#94a3b8', false, false),
    (pipeline_id, 'Qualification',2, 40,  '#60a5fa', false, false),
    (pipeline_id, 'Proposal',     3, 60,  '#a78bfa', false, false),
    (pipeline_id, 'Negotiation',  4, 80,  '#fb923c', false, false),
    (pipeline_id, 'Closed Won',   5, 100, '#4ade80', true,  false),
    (pipeline_id, 'Closed Lost',  6, 0,   '#f87171', false, true);
END $$;
