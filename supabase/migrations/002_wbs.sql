-- =============================================================================
-- Radya CRM — WBS Scheduling Engine (Projects + WBS Tasks)
-- Run this in Supabase Dashboard → SQL Editor (after 001_initial_schema.sql)
--
-- Adds MS-Project-style Work Breakdown Structure support:
--   • projects        — top-level project container
--   • wbs_tasks       — self-referencing hierarchy, max 4 layers, Gantt + Tiptap doc
--
-- Reuses update_updated_at() and is_admin() defined in 001.
-- =============================================================================

-- ── projects ──────────────────────────────────────────────────────────────────

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  start_date  date,
  end_date    date,
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  owner_id    uuid REFERENCES users,
  created_by  uuid REFERENCES users,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── wbs_tasks ───────────────────────────────────────────────────────────────--
-- parent_id NULL  => layer-1 root (a Phase)
-- layer_depth      => cached 1..4; enforced by check + application logic
-- wbs_code         => denormalized outline number ('1.2.1'); client recomputes
-- order_index      => ordering among direct siblings (drives WBS numbering)
-- progress_percent => manual for leaves, rolled-up for parents
-- weight_percent   => relative weight among direct siblings (should sum to 100)
-- document_content => Tiptap/Notion editor JSON state

CREATE TABLE wbs_tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  parent_id        uuid REFERENCES wbs_tasks ON DELETE CASCADE,
  title            text NOT NULL DEFAULT '',
  wbs_code         text,
  layer_depth      smallint NOT NULL DEFAULT 1
                     CHECK (layer_depth BETWEEN 1 AND 4),
  order_index      integer NOT NULL DEFAULT 0,
  start_date       date,
  end_date         date,
  duration_days    integer,
  progress_percent numeric NOT NULL DEFAULT 0
                     CHECK (progress_percent BETWEEN 0 AND 100),
  weight_percent   numeric NOT NULL DEFAULT 0
                     CHECK (weight_percent BETWEEN 0 AND 100),
  document_content jsonb,
  assignee_id      uuid REFERENCES users,
  created_by       uuid REFERENCES users,
  is_milestone     boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER wbs_tasks_updated_at
  BEFORE UPDATE ON wbs_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_wbs_tasks_project       ON wbs_tasks (project_id);
CREATE INDEX idx_wbs_tasks_parent        ON wbs_tasks (parent_id);
CREATE INDEX idx_wbs_tasks_project_order ON wbs_tasks (project_id, parent_id, order_index);

-- ── Row Level Security ──────────────────────────────────────────────────────--

ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wbs_tasks ENABLE ROW LEVEL SECURITY;

-- ── projects policies ─────────────────────────────────────────────────────────

CREATE POLICY "projects_select_authenticated"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "projects_insert_non_viewer"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "projects_update_owner_or_admin"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "projects_delete_owner_or_admin"
  ON projects FOR DELETE
  TO authenticated
  USING (
    (owner_id = auth.uid() OR created_by = auth.uid() OR is_admin())
    AND (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

-- ── wbs_tasks policies ──────────────────────────────────────────────────────--

CREATE POLICY "wbs_tasks_select_authenticated"
  ON wbs_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "wbs_tasks_insert_non_viewer"
  ON wbs_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "wbs_tasks_update_non_viewer"
  ON wbs_tasks FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );

CREATE POLICY "wbs_tasks_delete_non_viewer"
  ON wbs_tasks FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) != 'viewer'
  );
