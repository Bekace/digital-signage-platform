import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("📱 [GET DEVICES] Fetching devices for user:", user.id)

    // Query ONLY real devices from database - NO MOCK DATA
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

    console.log("📱 [GET DEVICES] Found", devices.length, "real devices from database")

    // Return ONLY real database data - NO MOCK DATA ADDED
    return NextResponse.json({
      success: true,
      devices: devices,
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
