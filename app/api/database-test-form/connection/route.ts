import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔌 [CONNECTION TEST] Testing database connection...")

    // Test basic connection
    const result = await sql`SELECT 1 as test, NOW() as timestamp, version() as db_version`

    const testResult = result[0]
    console.log("🔌 [CONNECTION TEST] Connection successful:", {
      test: testResult.test,
      timestamp: testResult.timestamp,
      version: testResult.db_version?.substring(0, 50) + "...",
    })

    // Test table creation capability
    await sql`
      CREATE TABLE IF NOT EXISTS connection_test_temp (
        id SERIAL PRIMARY KEY,
        test_value TEXT
      )
    `

    // Test insert capability
    await sql`
      INSERT INTO connection_test_temp (test_value) 
      VALUES ('connection_test_' || extract(epoch from now()))
    `

    // Test select capability
    const testData = await sql`
      SELECT COUNT(*) as count FROM connection_test_temp
    `

    // Clean up test table
    await sql`DROP TABLE IF EXISTS connection_test_temp`

    console.log("🔌 [CONNECTION TEST] Full CRUD test successful")

    return NextResponse.json({
      success: true,
      connection: {
        status: "connected",
        timestamp: testResult.timestamp,
        database_version: testResult.db_version,
        crud_test_passed: true,
        test_records_count: Number.parseInt(testData[0].count),
      },
      message: "Database connection and CRUD operations working correctly",
    })
  } catch (error) {
    console.error("🔌 [CONNECTION TEST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        connection: {
          status: "error",
          timestamp: new Date().toISOString(),
        },
        error: "Database connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
