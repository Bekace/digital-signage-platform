import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [GET DEVICES] Starting device fetch...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📱 [GET DEVICES] No authenticated user")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("📱 [GET DEVICES] Authenticated user:", user.id)

    // Test database connection first
    try {
      await sql`SELECT 1`
      console.log("📱 [GET DEVICES] Database connection successful")
    } catch (dbError) {
      console.error("📱 [GET DEVICES] Database connection failed:", dbError)
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 })
    }

    // Query devices table with detailed logging
    console.log("📱 [GET DEVICES] Querying devices for user_id:", user.id)

    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.platform,
        d.capabilities,
        d.screen_resolution,
        d.assigned_playlist_id,
        d.playlist_status,
        d.last_seen,
        d.created_at,
        d.user_id,
        p.name as assigned_playlist_name,
        CASE 
          WHEN d.last_seen > NOW() - INTERVAL '2 minutes' THEN 'online'
          WHEN d.last_seen > NOW() - INTERVAL '10 minutes' THEN 'idle'
          ELSE 'offline'
        END as connection_status
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    console.log("📱 [GET DEVICES] Raw database query result:", devices)
    console.log("📱 [GET DEVICES] Found", devices.length, "devices for user", user.id)

    // Log each device for debugging
    devices.forEach((device, index) => {
      console.log(`📱 [GET DEVICES] Device ${index + 1}:`, {
        id: device.id,
        name: device.name,
        device_type: device.device_type,
        status: device.status,
        user_id: device.user_id,
        created_at: device.created_at,
      })
    })

    return NextResponse.json({
      success: true,
      devices: devices,
      debug: {
        userId: user.id,
        deviceCount: devices.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("📱 [GET DEVICES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch devices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
