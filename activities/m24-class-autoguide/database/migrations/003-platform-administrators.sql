CREATE TABLE platform_administrators (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
