import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("Testing database connection...")

    // Test basic connection
    const connectionTest = await sql`SELECT 1 as test`
    console.log("Connection test result:", connectionTest)

    // Check if users table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `
    console.log("Users table check:", tableCheck)

    // Count users
    let userCount = 0
    let users = []
    try {
      const countResult = await sql`SELECT COUNT(*) as count FROM users`
      userCount = countResult[0]?.count || 0

      const usersResult = await sql`SELECT id, email, first_name, last_name, company FROM users LIMIT 5`
      users = usersResult
    } catch (error) {
      console.log("Users table might not exist:", error)
    }

    return NextResponse.json({
      success: true,
      connection: "OK",
      database_url_set: !!process.env.DATABASE_URL,
      database_url_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "Not set",
      tables: tableCheck,
      user_count: userCount,
      sample_users: users,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        database_url_set: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "Not set",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
