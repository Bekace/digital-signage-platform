import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DATABASE TEST] Testing connection...")

    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, version() as db_version`
    const { current_time, db_version } = result[0]

    // Test table creation and operations
    await sql`
      CREATE TABLE IF NOT EXISTS test_records (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Count existing records
    const countResult = await sql`SELECT COUNT(*) as count FROM test_records`
    const recordCount = Number.parseInt(countResult[0].count)

    console.log("✅ [DATABASE TEST] Connection successful!")

    return NextResponse.json({
      status: "connected",
      timestamp: current_time,
      database: db_version,
      testTable: "test_records",
      recordCount,
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("❌ [DATABASE TEST] Connection failed:", error)

    return NextResponse.json(
      {
        status: "disconnected",
        error: error instanceof Error ? error.message : "Unknown database error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
