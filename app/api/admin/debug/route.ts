import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("Debug: Starting admin debug check")

    // Removed getCurrentUser() from here

    const sql = getDb()
    console.log("Debug: Database connection established")

    // Check if users table has is_admin column
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
      `
      console.log("Debug: is_admin column info:", tableInfo)
    } catch (err) {
      console.log("Debug: Error checking is_admin column:", err)
    }

    return NextResponse.json({
      success: true,
      message: "Database and table check complete. User info needs to be fetched on the client.",
      step: "database_check_complete",
    })
  } catch (error) {
    console.error("Debug: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
        step: "general_error",
      },
      { status: 500 },
    )
  }
}
