ALTER TABLE account
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER password_hash;

CREATE INDEX idx_account_role_status ON account (role, account_status);

-- Promote an existing account to administrator after reviewing its identity:
-- UPDATE account SET role = 'admin' WHERE username = 'your-admin-username';
