import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Test the connection
    const result = await sql`
      SELECT 
        current_database() as database,
        inet_server_addr() as host,
        NOW() as timestamp
    `

    const connectionInfo = result[0]

    return NextResponse.json({
      connected: true,
      database: connectionInfo.database,
      host: connectionInfo.host || "localhost",
      timestamp: connectionInfo.timestamp,
      message: "Database connection successful",
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
