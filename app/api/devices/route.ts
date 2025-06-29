import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify JWT token
    let userId: number
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get all devices for the user
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.platform,
        d.capabilities,
        d.screen_resolution,
        d.status,
        d.last_seen,
        d.assigned_playlist_id,
        d.created_at,
        p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${userId}
      ORDER BY d.created_at DESC
    `

    return NextResponse.json({
      success: true,
      devices: devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.device_type,
        platform: device.platform,
        capabilities: JSON.parse(device.capabilities || "[]"),
        screenResolution: device.screen_resolution,
        status: device.status,
        lastSeen: device.last_seen,
        assignedPlaylist: device.assigned_playlist_id
          ? {
              id: device.assigned_playlist_id,
              name: device.playlist_name,
            }
          : null,
        createdAt: device.created_at,
      })),
    })
  } catch (error) {
    console.error("Get devices error:", error)
    return NextResponse.json(
      {
        error: "Failed to get devices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
