import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const sql = getDb()

    // For demo, use user ID 1
    const userId = 1

    // Get devices with playlist information
    const result = await sql`
      SELECT 
        d.device_id, 
        d.screen_name, 
        d.device_type, 
        d.platform, 
        d.status, 
        d.location, 
        d.resolution, 
        d.last_seen, 
        d.registered_at,
        d.assigned_playlist_id,
        d.playlist_status,
        d.last_control_action,
        d.last_control_time,
        p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${userId} 
      ORDER BY d.registered_at DESC
    `

    // Update status based on last_seen
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const devices = result.map((device) => {
      const isOnline = new Date(device.last_seen) >= fiveMinutesAgo
      const actualStatus = isOnline ? device.status : "offline"

      return {
        id: device.device_id,
        screenName: device.screen_name,
        deviceType: device.device_type,
        platform: device.platform,
        status: actualStatus,
        location: device.location,
        resolution: device.resolution,
        lastSeen: device.last_seen,
        registeredAt: device.registered_at,
        currentPlaylist: device.assigned_playlist_id
          ? {
              id: device.assigned_playlist_id,
              name: device.playlist_name || "Unknown Playlist",
              status: device.playlist_status || "stopped",
              lastAction: device.last_control_action,
              lastActionTime: device.last_control_time,
            }
          : null,
      }
    })

    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
      playing: devices.filter((d) => d.currentPlaylist?.status === "playing").length,
    }

    return NextResponse.json({
      success: true,
      devices: devices,
      ...stats,
    })
  } catch (error) {
    console.error("Get devices error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
