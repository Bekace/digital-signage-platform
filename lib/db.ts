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

  // Convert parameterized query to Neon format
  let processedQuery = text
  if (params.length > 0) {
    params.forEach((param, index) => {
      processedQuery = processedQuery.replace(`$${index + 1}`, `'${param}'`)
    })
  }

  const result = await sql(processedQuery)
  return { rows: result }
}
