// Script to create a test user with proper password hashing
const bcrypt = require("bcryptjs")

async function createTestUser() {
  const email = "bekace.multimedia@gmail.com"
  const password = "your_actual_password" // Replace with the actual password

  const hashedPassword = await bcrypt.hash(password, 10)

  console.log("Test user creation SQL:")
  console.log(`
INSERT INTO users (email, password_hash, first_name, last_name, plan, created_at)
VALUES (
  '${email}',
  '${hashedPassword}',
  'Test',
  'User',
  'free',
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();
  `)

  console.log("\nPassword verification test:")
  const isValid = await bcrypt.compare(password, hashedPassword)
  console.log("Password verification result:", isValid)
}

createTestUser().catch(console.error)
