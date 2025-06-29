import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] Fetching devices list")

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ [DEVICES API] No valid authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("✅ [DEVICES API] User authenticated:", decoded.userId)

    // Get devices with playlist information
    const devicesResult = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.last_seen,
        d.assigned_playlist_id,
        d.playlist_status,
        d.last_control_action,
        d.last_control_time,
        d.created_at,
        d.updated_at,
        p.name as playlist_name,
        COALESCE(pi.item_count, 0) as playlist_item_count
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      LEFT JOIN (
        SELECT playlist_id, COUNT(*) as item_count
        FROM playlist_items
        GROUP BY playlist_id
      ) pi ON p.id = pi.playlist_id
      WHERE d.user_id = ${decoded.userId}
      ORDER BY d.created_at DESC
    `

    console.log("📱 [DEVICES API] Found", devicesResult.length, "devices")

    // Get device statistics
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'online' THEN 1 END) as online,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline,
        COUNT(CASE WHEN playlist_status = 'playing' THEN 1 END) as playing
      FROM devices 
      WHERE user_id = ${decoded.userId}
    `

    const stats = statsResult[0] || { total: 0, online: 0, offline: 0, playing: 0 }
    console.log("📊 [DEVICES API] Device statistics:", stats)

    // Format devices data
    const devices = devicesResult.map((device) => ({
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
      playlist: device.assigned_playlist_id
        ? {
            id: device.assigned_playlist_id,
            name: device.playlist_name,
            itemCount: Number.parseInt(device.playlist_item_count) || 0,
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      devices,
      stats: {
        total: Number.parseInt(stats.total) || 0,
        online: Number.parseInt(stats.online) || 0,
        offline: Number.parseInt(stats.offline) || 0,
        playing: Number.parseInt(stats.playing) || 0,
      },
    })
  } catch (error) {
    console.error("❌ [DEVICES API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}
