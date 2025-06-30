import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log(`📱 [DEVICES API] Fetching devices for user ${user.id}`)

    // Get devices with playlist information
    const devices = await sql`
      SELECT 
        d.*,
        p.id as playlist_id,
        p.name as playlist_name,
        (
          SELECT COUNT(*) 
          FROM playlist_items pi 
          WHERE pi.playlist_id = p.id
        ) as playlist_item_count
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    // Calculate statistics
    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
      playing: devices.filter((d) => d.playlist_status === "playing").length,
    }

    // Format devices for response
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name,
      deviceType: device.device_type,
      status: device.status,
      lastSeen: device.last_seen,
      assignedPlaylistId: device.assigned_playlist_id,
      playlistStatus: device.playlist_status || "none",
      lastControlAction: device.last_control_action,
      lastControlTime: device.last_control_time,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      playlist: device.playlist_id
        ? {
            id: device.playlist_id,
            name: device.playlist_name,
            itemCount: device.playlist_item_count || 0,
          }
        : null,
    }))

    console.log(`✅ [DEVICES API] Found ${devices.length} devices for user ${user.id}`)

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
      stats,
    })
  } catch (error) {
    console.error("❌ [DEVICES API] Error:", error)
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
