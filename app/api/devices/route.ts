import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Get devices for the current user
    const devices = await sql`
      SELECT 
        id,
        name,
        device_type,
        status,
        playlist_status,
        assigned_playlist_id,
        last_seen,
        created_at,
        updated_at
      FROM devices 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      devices: devices,
      count: devices.length,
    })
  } catch (error) {
    console.error("Get devices error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch devices",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, device_type } = body

    if (!name || !device_type) {
      return NextResponse.json({ success: false, message: "Name and device type are required" }, { status: 400 })
    }

    const sql = getDb()

    // Create new device
    const result = await sql`
      INSERT INTO devices (name, device_type, user_id, status, playlist_status, created_at, updated_at)
      VALUES (${name}, ${device_type}, ${user.id}, 'offline', 'none', NOW(), NOW())
      RETURNING *
    `

    const device = result[0]

    return NextResponse.json({
      success: true,
      message: "Device created successfully",
      device: device,
    })
  } catch (error) {
    console.error("Create device error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create device",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
