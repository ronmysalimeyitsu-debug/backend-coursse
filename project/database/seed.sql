-- Seed data: three requests with their birth history, and one transition.
-- Safe to run once on an empty schema. It only INSERTs — it never deletes.

WITH new_request AS (
  INSERT INTO requests (title, description, priority)
  VALUES ('Projector does not turn on', 'The projector in room 204 shows no image during class.', 'high')
  RETURNING id, status
)
INSERT INTO request_status_history (request_id, previous_status, new_status)
SELECT id, NULL, status FROM new_request;

WITH new_request AS (
  INSERT INTO requests (title, description, priority)
  VALUES ('Broken chair in the lab', 'One chair in the computer lab has a loose back rest.', 'medium')
  RETURNING id, status
)
INSERT INTO request_status_history (request_id, previous_status, new_status)
SELECT id, NULL, status FROM new_request;

WITH new_request AS (
  INSERT INTO requests (title, description, priority)
  VALUES ('Wi-Fi drops in the library', 'The connection drops every few minutes on the second floor.', 'low')
  RETURNING id, status
)
INSERT INTO request_status_history (request_id, previous_status, new_status)
SELECT id, NULL, status FROM new_request;

-- Move the second request to in_progress, recording the transition.
WITH moved AS (
  UPDATE requests
  SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
  WHERE title = 'Broken chair in the lab' AND status = 'open'
  RETURNING id
)
INSERT INTO request_status_history (request_id, previous_status, new_status)
SELECT id, 'open', 'in_progress' FROM moved;
