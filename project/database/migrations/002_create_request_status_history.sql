-- 002 · Status history: one row per transition, including birth (NULL -> open).
-- Run after 001 — the foreign key needs the requests table to exist.

CREATE TABLE request_status_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id BIGINT NOT NULL,
  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT request_status_history_request_fk
    FOREIGN KEY (request_id)
    REFERENCES requests(id),
  CONSTRAINT request_status_history_previous_check
    CHECK (
      previous_status IS NULL OR
      previous_status IN (
        'open',
        'in_progress',
        'resolved',
        'closed',
        'cancelled'
      )
    ),
  CONSTRAINT request_status_history_new_check
    CHECK (
      new_status IN (
        'open',
        'in_progress',
        'resolved',
        'closed',
        'cancelled'
      )
    )
);
