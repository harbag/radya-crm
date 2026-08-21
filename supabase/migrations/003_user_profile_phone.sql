-- Add an optional phone number to CRM user profiles.
-- Authentication credentials remain managed by Supabase Auth.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone text;
