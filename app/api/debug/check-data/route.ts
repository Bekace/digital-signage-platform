import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    // Check database connection
    const connectionResult = await sql`SELECT 1 as connection_test`
    const connection = connectionResult.rows[0].connection_test === 1 ? "OK" : "Failed"

    // Get database URL preview (masked for security)
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ""
    const dbUrlPreview = dbUrl
      ? `${dbUrl.split("://")[0]}://${dbUrl.split("://")[1]?.split(":")[0]}:****@${dbUrl.split("@")[1]?.split("/")[0]}/${dbUrl.split("/").pop()}`
      : "Not set"

    // Get list of tables
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Get user count
    let userCount = "0"
    try {
      const userCountResult = await sql`SELECT COUNT(*) as count FROM users`
      userCount = userCountResult.rows[0].count
    } catch (err) {
      console.error("Error counting users:", err)
    }

    // Get devices
    let devices = []
    try {
      const devicesResult = await sql`
        SELECT device_id, screen_name, status, last_seen, user_id
        FROM devices
        ORDER BY registered_at DESC
        LIMIT 100
      `
      devices = devicesResult.rows
    } catch (err) {
      console.error("Error fetching devices:", err)
    }

    // Get media files
    let media = []
    try {
      const mediaResult = await sql`
        SELECT id, filename, original_name, file_type, file_size, user_id
        FROM media_files
        ORDER BY created_at DESC
        LIMIT 100
      `
      media = mediaResult.rows
    } catch (err) {
      console.error("Error fetching media:", err)
    }

    // Get playlists
    let playlists = []
    try {
      const playlistsResult = await sql`
        SELECT id, name, description, status, user_id
        FROM playlists
        ORDER BY created_at DESC
        LIMIT 100
      `
      playlists = playlistsResult.rows
    } catch (err) {
      console.error("Error fetching playlists:", err)
    }

    // Get device codes
    let deviceCodes = []
    try {
      const deviceCodesResult = await sql`
        SELECT code, user_id, expires_at, used
        FROM device_codes
        ORDER BY created_at DESC
        LIMIT 10
      `
      deviceCodes = deviceCodesResult.rows
    } catch (err) {
      console.error("Error fetching device codes:", err)
      // This is the error we're seeing - column "device_code" does not exist
      // Let's check if the table exists but has different column names
      try {
        const tableInfo = await sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'device_codes'
        `
        deviceCodes = [{ error: "Table exists but columns are different", columns: tableInfo.rows }]
      } catch (innerErr) {
        deviceCodes = [{ error: "Could not get table structure" }]
      }
    }

    return NextResponse.json({
      success: true,
      connection,
      database_url_set: !!dbUrl,
      database_url_preview: dbUrlPreview,
      tables: tablesResult.rows,
      user_count: userCount,
      devices,
      media,
      playlists,
      device_codes: deviceCodes,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug data error:", error)
    return NextResponse.json({
      success: false,
      connection: "Failed",
      database_url_set: !!process.env.DATABASE_URL,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
