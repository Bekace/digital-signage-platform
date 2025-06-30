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

    console.log("📱 [DEVICES] Fetching devices for user:", user.id)

    const devices = await sql`
      SELECT 
        id,
        name,
        device_type,
        status,
        last_seen,
        assigned_playlist_id,
        playlist_status,
        last_control_action,
        last_control_time,
        created_at,
        updated_at
      FROM devices 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    console.log("📱 [DEVICES] Found devices:", devices.length)

    // Format the data for frontend
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name,
      deviceType: device.device_type, // Convert snake_case to camelCase
      status: device.status,
      lastSeen: device.last_seen,
      assignedPlaylistId: device.assigned_playlist_id,
      playlistStatus: device.playlist_status || "none",
      lastControlAction: device.last_control_action,
      lastControlTime: device.last_control_time,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
    }))

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
    })
  } catch (error) {
    console.error("❌ [DEVICES] Error fetching devices:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch devices" }, { status: 500 })
  }
}
