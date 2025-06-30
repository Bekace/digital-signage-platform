import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] Fetching devices...")

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      console.log("📱 [DEVICES API] No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("📱 [DEVICES API] User authenticated:", user.id)

    // Fetch devices for the current user
    const devices = await sql`
      SELECT 
        id,
        name,
        device_type,
        status,
        COALESCE(playlist_status, 'none') as playlist_status,
        assigned_playlist_id,
        last_control_action,
        last_control_time,
        created_at,
        updated_at
      FROM devices 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    console.log("📱 [DEVICES API] Found devices:", devices.length)

    // Format the response to match frontend expectations
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name || "Unnamed Device",
      deviceType: device.device_type || "unknown",
      status: device.status || "offline",
      playlistStatus: device.playlist_status || "none",
      assignedPlaylistId: device.assigned_playlist_id,
      lastControlAction: device.last_control_action,
      lastControlTime: device.last_control_time,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
    }))

    console.log("📱 [DEVICES API] Returning formatted devices:", formattedDevices.length)

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
    })
  } catch (error) {
    console.error("📱 [DEVICES API] Error fetching devices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch devices",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] Creating new device...")

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      console.log("📱 [DEVICES API] No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, deviceType, pairingCode } = body

    console.log("📱 [DEVICES API] Request data:", { name, deviceType, pairingCode })

    if (!name || !deviceType) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and device type are required",
        },
        { status: 400 },
      )
    }

    // Create the device
    const result = await sql`
      INSERT INTO devices (
        user_id, 
        name, 
        device_type, 
        status,
        playlist_status,
        created_at,
        updated_at
      ) VALUES (
        ${user.id}, 
        ${name}, 
        ${deviceType}, 
        'offline',
        'none',
        NOW(),
        NOW()
      )
      RETURNING id, name, device_type, status, playlist_status, created_at, updated_at
    `

    const newDevice = result[0]
    console.log("📱 [DEVICES API] Device created:", newDevice.id)

    // If pairing code was provided, mark it as used
    if (pairingCode) {
      await sql`
        UPDATE device_pairing_codes 
        SET used_at = NOW(), device_id = ${newDevice.id}
        WHERE pairing_code = ${pairingCode} AND user_id = ${user.id}
      `
      console.log("📱 [DEVICES API] Pairing code marked as used")
    }

    return NextResponse.json({
      success: true,
      device: {
        id: newDevice.id,
        name: newDevice.name,
        deviceType: newDevice.device_type,
        status: newDevice.status,
        playlistStatus: newDevice.playlist_status,
        createdAt: newDevice.created_at,
        updatedAt: newDevice.updated_at,
      },
    })
  } catch (error) {
    console.error("📱 [DEVICES API] Error creating device:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create device",
      },
      { status: 500 },
    )
  }
}
