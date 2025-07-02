-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  media_files_limit INTEGER DEFAULT 5,
  storage_limit_gb INTEGER DEFAULT 1,
  screens_limit INTEGER DEFAULT 1,
  playlists_limit INTEGER DEFAULT 3,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, media_files_limit, storage_limit_gb, screens_limit, playlists_limit, features) VALUES
('free', 'Free Plan', 0, 0, 5, 1, 1, 3, '{"support": "community", "analytics": false, "custom_branding": false}'),
('basic', 'Basic Plan', 9.99, 99.99, 50, 10, 5, 20, '{"support": "email", "analytics": true, "custom_branding": false}'),
('pro', 'Pro Plan', 29.99, 299.99, 200, 50, 20, 100, '{"support": "priority", "analytics": true, "custom_branding": true}'),
('enterprise', 'Enterprise Plan', 99.99, 999.99, -1, -1, -1, -1, '{"support": "phone", "analytics": true, "custom_branding": true, "api_access": true}')
ON CONFLICT (name) DO NOTHING;

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add admin role to existing user (replace with your user ID)
INSERT INTO admin_users (user_id, role, permissions) 
SELECT id, 'super_admin', '{"manage_plans": true, "manage_users": true, "view_analytics": true}'
FROM users 
WHERE email = 'admin@example.com' -- Replace with your email
ON CONFLICT DO NOTHING;

-- Update users table to reference subscription plans
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES subscription_plans(id);

-- Set all existing users to free plan
UPDATE users SET plan_id = (SELECT id FROM subscription_plans WHERE name = 'free') WHERE plan_id IS NULL;
