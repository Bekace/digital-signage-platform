import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Test basic database connection
    const result = await sql`SELECT 1 as test`

    // Test users table
    const userCount = await sql`SELECT COUNT(*) as count FROM users`

    // Test devices table
    const deviceCount = await sql`SELECT COUNT(*) as count FROM devices`

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        connection: "OK",
        testQuery: result[0],
        userCount: userCount[0].count,
        deviceCount: deviceCount[0].count,
      },
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database connection failed",
        details: error,
      },
      { status: 500 },
    )
  }
}
