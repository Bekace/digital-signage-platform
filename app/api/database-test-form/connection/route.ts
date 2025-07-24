import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Test the connection with a simple query
    const result = await sql`SELECT 1 as test, NOW() as timestamp, current_database() as database`

    const testResult = result[0]

    return NextResponse.json({
      connected: true,
      database: testResult.database,
      host: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "Unknown",
      timestamp: testResult.timestamp,
      test: testResult.test,
    })
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    return NextResponse.json({
      connected: false,
      database: "Unknown",
      host: "Unknown",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
