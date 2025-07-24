import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Test the database connection
    const result = await sql`SELECT 1 as test, NOW() as timestamp`

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      test: result[0].test,
      timestamp: result[0].timestamp,
      status: "connected",
    })
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 },
    )
  }
}
