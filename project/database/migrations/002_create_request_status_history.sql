CREATE TABLE request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id),
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL CHECK (new_status IN ('open', 'in_progress', 'closed')),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);