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

    // Fetch devices without playlist information for now
    const devices = await sql`
      SELECT 
        id,
        name,
        COALESCE(type, 'monitor') as type,
        COALESCE(status, 'offline') as status,
        location,
        COALESCE(last_seen, created_at) as last_seen,
        code,
        created_at,
        orientation,
        brightness,
        volume,
        auto_restart,
        restart_time,
        notes,
        user_id
      FROM devices 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    console.log("🔍 [DEVICES API] Found devices:", devices.length)

    // Format devices for frontend
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name,
      type: device.type,
      status: device.status,
      location: device.location,
      lastSeen: device.last_seen,
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
      // Will add playlist info later when table is created
      current_playlist: null,
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
