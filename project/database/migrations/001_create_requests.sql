-- 001 · Requests table: the persistent form of the class-03 resource.
-- Run this file first, in the Supabase SQL Editor.

CREATE TABLE requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT requests_priority_check
    CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT requests_status_check
    CHECK (
      status IN (
        'open',
        'in_progress',
        'resolved',
        'closed',
        'cancelled'
      )
    )
);
