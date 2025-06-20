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

export async function query(text: string, params: any[] = []) {
  const sql = getDb()

  // For Neon, we use template literals instead of parameterized queries
  try {
    const result = await sql(text, params)
    return { rows: result }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
