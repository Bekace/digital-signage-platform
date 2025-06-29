import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    // Get user's devices
    const devices = await sql`
      SELECT 
        id,
        name,
        device_type as "deviceType",
        status,
        last_seen as "lastSeen",
        assigned_playlist_id as "assignedPlaylistId",
        created_at as "createdAt"
      FROM devices 
      WHERE user_id = ${decoded.userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      devices: devices,
    })
  } catch (error) {
    console.error("Devices fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    const { name, deviceType } = await request.json()

    if (!name || !deviceType) {
      return NextResponse.json({ error: "Name and device type are required" }, { status: 400 })
    }

    // Create new device
    const newDevice = await sql`
      INSERT INTO devices (user_id, name, device_type, status, created_at)
      VALUES (${decoded.userId}, ${name}, ${deviceType}, 'offline', NOW())
      RETURNING id, name, device_type as "deviceType", status, created_at as "createdAt"
    `

    return NextResponse.json({
      success: true,
      device: newDevice[0],
    })
  } catch (error) {
    console.error("Device creation error:", error)
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 })
  }
}
