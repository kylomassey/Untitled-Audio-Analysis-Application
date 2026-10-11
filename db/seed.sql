-- Starting data the app needs. Run after schema.sql.
INSERT INTO role (id, role, description) VALUES
  (1, 'user', 'Standard user')
ON CONFLICT (id) DO NOTHING;
