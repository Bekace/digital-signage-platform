import { NextResponse } from "next/server"
import { getDb, testDatabaseConnection } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Test basic connection
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`)
    }

    // Check all required tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    const requiredTables = [
      "users",
      "password_reset_tokens",
      "device_pairing_codes",
      "devices",
      "device_heartbeats",
      "media_files",
      "playlists",
      "playlist_items",
      "plans",
      "plan_features",
      "user_plans",
    ]

    const existingTables = tables.map((t) => t.table_name)
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    // Count records in each table
    const tableCounts = {}
    for (const table of existingTables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`
        tableCounts[table] = Number.parseInt(count[0].count)
      } catch (error) {
        tableCounts[table] = `Error: ${error.message}`
      }
    }

    // Check for demo/sample data
    const demoDataCheck = {
      demo_users: 0,
      demo_devices: 0,
      test_pairing_codes: 0,
    }

    try {
      const demoUsers = await sql`SELECT COUNT(*) as count FROM users WHERE email = 'demo@signagecloud.com'`
      demoDataCheck.demo_users = Number.parseInt(demoUsers[0].count)

      const demoDevices =
        await sql`SELECT COUNT(*) as count FROM devices WHERE device_id LIKE 'device_demo%' OR screen_name LIKE 'Sample Screen%'`
      demoDataCheck.demo_devices = Number.parseInt(demoDevices[0].count)

      const testCodes =
        await sql`SELECT COUNT(*) as count FROM device_pairing_codes WHERE code IN ('TEST01', 'TEST02', 'DEMO01')`
      demoDataCheck.test_pairing_codes = Number.parseInt(testCodes[0].count)
    } catch (error) {
      console.log("Demo data check error (tables might not exist):", error.message)
    }

    return NextResponse.json({
      success: true,
      database_connection: connectionTest,
      tables: {
        existing: existingTables,
        missing: missingTables,
        counts: tableCounts,
      },
      demo_data: demoDataCheck,
      environment: {
        database_url_configured: !!process.env.DATABASE_URL,
        database_url_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "Not set",
      },
    })
  } catch (error) {
    console.error("Database verification error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database verification failed",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
