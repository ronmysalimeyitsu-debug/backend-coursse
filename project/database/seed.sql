-- Insert initial sample requests
INSERT INTO requests (id, title, status, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fix authentication bug in login page', 'open', NOW(), NOW()),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Update database schema for user profiles', 'in_progress', NOW(), NOW()),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Deploy v1.0 release to production', 'closed', NOW(), NOW());

-- Insert corresponding initial history records
INSERT INTO request_status_history (request_id, previous_status, new_status, changed_at) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'open', 'in_progress', NOW()),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'open', 'in_progress', NOW()),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'in_progress', 'closed', NOW());