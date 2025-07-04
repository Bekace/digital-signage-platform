import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEVICES API] Starting device fetch...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("🔍 [DEVICES API] No authenticated user")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔍 [DEVICES API] User authenticated:", user.email)
    const sql = getDb()

    // Fetch devices with current playlist information
    const devices = await sql`
      SELECT 
        d.*,
        p.id as playlist_id,
        p.name as playlist_name,
        COUNT(pi.id)::text as playlist_items
      FROM devices d
      LEFT JOIN device_playlists dp ON d.id = dp.device_id AND dp.user_id = d.user_id
      LEFT JOIN playlists p ON dp.playlist_id = p.id
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE d.user_id = ${user.id}
      GROUP BY d.id, d.name, d.type, d.status, d.location, d.last_seen, d.code, d.created_at, d.updated_at, 
               d.user_id, d.orientation, d.brightness, d.volume, d.auto_restart, d.restart_time, d.notes,
               p.id, p.name
      ORDER BY d.created_at DESC
    `

    console.log("🔍 [DEVICES API] Found devices:", devices.length)

    // Format devices for frontend
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name,
      type: device.type || "monitor",
      status: device.status || "offline",
      location: device.location,
      lastSeen: device.last_seen || device.created_at,
      resolution: "1920x1080", // Default resolution
      orientation: device.orientation,
      brightness: device.brightness,
      volume: device.volume,
      autoRestart: device.auto_restart,
      restartTime: device.restart_time,
      notes: device.notes,
      last_seen: device.last_seen,
      code: device.code,
      created_at: device.created_at,
      current_playlist: device.playlist_id
        ? {
            id: device.playlist_id,
            name: device.playlist_name,
            items: Number.parseInt(device.playlist_items) || 0,
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
    })
  } catch (error) {
    console.error("🔍 [DEVICES API] Error:", error)
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
