const crypto = require("crypto")

// Generate a secure random JWT secret
const jwtSecret = crypto.randomBytes(64).toString("hex")

console.log("Generated JWT_SECRET:")
console.log(jwtSecret)
console.log("\nAdd this to your .env.local file:")
console.log(`JWT_SECRET="${jwtSecret}"`)
console.log("\nYour complete .env.local should look like:")
console.log('DATABASE_URL="your-neon-database-url"')
console.log(`JWT_SECRET="${jwtSecret}"`)
console.log('NEXT_PUBLIC_APP_URL="http://localhost:3000"')
