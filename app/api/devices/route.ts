import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] GET request")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("❌ [DEVICES API] No token provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("✅ [DEVICES API] Token verified for user:", decoded.userId)

    // Fetch devices with playlist information
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type as "deviceType",
        d.platform,
        d.status,
        d.last_seen as "lastSeen",
        d.assigned_playlist_id as "assignedPlaylistId",
        d.playlist_status as "playlistStatus",
        d.last_control_action as "lastControlAction",
        d.last_control_time as "lastControlTime",
        d.created_at as "createdAt",
        d.updated_at as "updatedAt",
        p.id as "playlistId",
        p.name as "playlistName",
        (SELECT COUNT(*) FROM playlist_items pi WHERE pi.playlist_id = p.id) as "playlistItemCount"
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${decoded.userId}
      ORDER BY d.created_at DESC
    `

    console.log("📱 [DEVICES API] Found", devices.length, "devices")

    // Format devices with playlist information
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name,
      deviceType: device.deviceType,
      platform: device.platform,
      status: device.status,
      lastSeen: device.lastSeen,
      assignedPlaylistId: device.assignedPlaylistId,
      playlistStatus: device.playlistStatus || "none",
      lastControlAction: device.lastControlAction,
      lastControlTime: device.lastControlTime,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      playlist: device.playlistId
        ? {
            id: device.playlistId,
            name: device.playlistName,
            itemCount: Number.parseInt(device.playlistItemCount) || 0,
          }
        : null,
    }))

    // Calculate statistics
    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
      playing: devices.filter((d) => d.playlistStatus === "playing").length,
    }

    console.log("📊 [DEVICES API] Stats:", stats)

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
      stats,
    })
  } catch (error) {
    console.error("💥 [DEVICES API] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch devices" }, { status: 500 })
  }
}
