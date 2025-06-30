import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] ===== STARTING GET /api/devices =====")

    // Get current user
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("❌ [DEVICES API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          debug: "No user found in getCurrentUser()",
        },
        { status: 401 },
      )
    }

    console.log(`✅ [DEVICES API] Authenticated user: ${user.email} (ID: ${user.id})`)

    // Get devices for this user
    console.log("📱 [DEVICES API] Fetching devices from database...")
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type as "deviceType",
        d.status,
        d.last_seen as "lastSeen",
        d.assigned_playlist_id as "assignedPlaylistId",
        d.playlist_status as "playlistStatus",
        d.last_control_action as "lastControlAction",
        d.last_control_time as "lastControlTime",
        d.created_at as "createdAt",
        d.updated_at as "updatedAt",
        p.id as "playlist_id",
        p.name as "playlist_name",
        (
          SELECT COUNT(*) 
          FROM playlist_items pi 
          WHERE pi.playlist_id = p.id
        ) as "playlist_item_count"
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    console.log(`📱 [DEVICES API] Found ${devices.length} devices`)

    // Format devices with playlist info
    const formattedDevices = devices.map((device: any) => ({
      id: device.id,
      name: device.name,
      deviceType: device.deviceType,
      status: device.status,
      lastSeen: device.lastSeen,
      assignedPlaylistId: device.assignedPlaylistId,
      playlistStatus: device.playlistStatus || "none",
      lastControlAction: device.lastControlAction,
      lastControlTime: device.lastControlTime,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      playlist: device.playlist_id
        ? {
            id: device.playlist_id,
            name: device.playlist_name,
            itemCount: Number.parseInt(device.playlist_item_count) || 0,
          }
        : null,
    }))

    // Calculate stats
    const stats = {
      total: devices.length,
      online: devices.filter((d: any) => d.status === "online").length,
      offline: devices.filter((d: any) => d.status === "offline").length,
      playing: devices.filter((d: any) => d.playlist_status === "playing").length,
    }

    console.log("📱 [DEVICES API] Stats:", stats)
    console.log("📱 [DEVICES API] ===== GET /api/devices COMPLETE =====")

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
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] ===== STARTING POST /api/devices =====")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("❌ [DEVICES API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    console.log("📱 [DEVICES API] Request body:", body)

    const { name, deviceType, pairingCode } = body

    if (!name || !deviceType) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and device type are required",
        },
        { status: 400 },
      )
    }

    // If pairing code is provided, validate it
    if (pairingCode) {
      console.log("📱 [DEVICES API] Validating pairing code:", pairingCode)
      const pairingCodes = await sql`
        SELECT * FROM device_pairing_codes 
        WHERE code = ${pairingCode} 
        AND expires_at > NOW()
        AND completed_at IS NULL
        LIMIT 1
      `

      if (pairingCodes.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid or expired pairing code",
          },
          { status: 400 },
        )
      }

      // Mark pairing code as used
      await sql`
        UPDATE device_pairing_codes 
        SET completed_at = NOW()
        WHERE code = ${pairingCode}
      `
    }

    // Create device
    console.log("📱 [DEVICES API] Creating device...")
    const devices = await sql`
      INSERT INTO devices (name, device_type, user_id, status, last_seen)
      VALUES (${name}, ${deviceType}, ${user.id}, 'offline', NOW())
      RETURNING *
    `

    const device = devices[0]
    console.log("📱 [DEVICES API] Device created:", device)

    return NextResponse.json({
      success: true,
      message: "Device added successfully",
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        status: device.status,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
      },
    })
  } catch (error) {
    console.error("❌ [DEVICES API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
