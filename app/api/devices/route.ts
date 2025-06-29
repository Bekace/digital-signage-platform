import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES] Fetching devices list")

    // Get auth token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      console.log("❌ [DEVICES] No auth token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("👤 [DEVICES] User ID from token:", decoded.userId)

    // Get devices with playlist information
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.last_seen,
        d.created_at,
        d.assigned_playlist_id,
        d.playlist_status,
        d.last_control_action,
        d.last_control_time,
        d.updated_at,
        p.name as playlist_name,
        (
          SELECT COUNT(*) 
          FROM playlist_items pi 
          WHERE pi.playlist_id = d.assigned_playlist_id
        ) as playlist_item_count
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${decoded.userId}
      ORDER BY d.created_at DESC
    `

    console.log("📊 [DEVICES] Found devices:", devices.length)

    // Calculate device statistics
    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
      playing: devices.filter((d) => d.playlist_status === "playing").length,
    }

    console.log("📈 [DEVICES] Device stats:", stats)

    return NextResponse.json({
      success: true,
      devices: devices.map((device) => ({
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        status: device.status,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
        assignedPlaylistId: device.assigned_playlist_id,
        playlistStatus: device.playlist_status || "stopped",
        lastControlAction: device.last_control_action,
        lastControlTime: device.last_control_time,
        updatedAt: device.updated_at,
        playlist: device.assigned_playlist_id
          ? {
              id: device.assigned_playlist_id,
              name: device.playlist_name,
              itemCount: device.playlist_item_count || 0,
            }
          : null,
      })),
      stats,
    })
  } catch (error) {
    console.error("💥 [DEVICES] Error fetching devices:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}
