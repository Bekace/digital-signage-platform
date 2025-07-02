import { neon } from "@neondatabase/serverless"

let sql: any = null

export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}

export async function testConnection() {
  try {
    const sql = getDb()
    const result = await sql`SELECT 1 as test`
    return { success: true, result }
  } catch (error) {
    console.error("Database connection failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
