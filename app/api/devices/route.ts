import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    // Get devices for this user
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.last_seen,
        d.user_id,
        d.created_at,
        d.updated_at,
        d.assigned_playlist_id,
        d.playlist_status,
        d.last_control_action,
        d.last_control_time
      FROM devices d
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    // Format devices for response
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name || `Device ${device.id}`,
      deviceType: device.device_type || "unknown",
      status: device.status === "online" ? "online" : "offline",
      lastSeen: device.last_seen || device.updated_at || device.created_at,
      assignedPlaylistId: device.assigned_playlist_id,
      playlistStatus: device.playlist_status || "none",
      lastControlAction: device.last_control_action,
      lastControlTime: device.last_control_time,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      playlist: null,
    }))

    // Calculate statistics
    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
      playing: devices.filter((d) => d.playlist_status === "playing").length,
    }

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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, description } = body

    // Generate a pairing code for the new device
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create the device
    const deviceResult = await sql`
      INSERT INTO devices (user_id, name, device_type, status, created_at, updated_at)
      VALUES (${user.id}, ${name}, 'unknown', 'offline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `

    if (deviceResult.length === 0) {
      throw new Error("Failed to create device")
    }

    const device = deviceResult[0]

    // Create pairing code
    await sql`
      INSERT INTO device_pairing_codes (code, expires_at, device_id, user_id, screen_name, created_at)
      VALUES (${pairingCode}, ${expiresAt.toISOString()}, ${device.id}, ${user.id}, ${name}, CURRENT_TIMESTAMP)
    `

    return NextResponse.json({
      success: true,
      device: {
        ...device,
        pairingCode: pairingCode,
        pairingExpiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [DEVICES API] Error creating device:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
