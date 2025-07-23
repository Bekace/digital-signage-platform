import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Single database connection using only DATABASE_URL
const sql = neon(process.env.DATABASE_URL)

export function getDb() {
  return sql
}

// Export the sql instance for direct use
export { sql }

// Database connection test function
export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT 1 as test, NOW() as timestamp`
    console.log("Database connection test successful:", result[0])
    return { success: true, result: result[0] }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return { success: false, error: error.message }
  }
}
