import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [CONNECTION TEST] Testing database connection...")

    // Simple connection test
    const result = await sql`SELECT 1 as test`

    console.log("✅ [CONNECTION TEST] Database connected successfully")

    // Get basic database info
    const dbInfo = await sql`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version
    `

    // Count some tables
    const tableCount = await sql`
      SELECT count(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    return NextResponse.json({
      success: true,
      status: "connected",
      database: dbInfo[0].database_name,
      user: dbInfo[0].user_name,
      version: dbInfo[0].version,
      tableCount: Number.parseInt(tableCount[0].table_count),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [CONNECTION TEST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        status: "disconnected",
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
