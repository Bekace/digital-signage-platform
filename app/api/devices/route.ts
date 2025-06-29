import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }

    // Get user's devices
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type as "deviceType",
        d.capabilities,
        d.last_seen as "lastSeen",
        d.status,
        d.assigned_playlist_id as "assignedPlaylistId",
        p.name as "playlistName",
        d.created_at as "createdAt"
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${decoded.userId}
      ORDER BY d.created_at DESC
    `

    return NextResponse.json({
      success: true,
      devices: devices.map((device) => ({
        ...device,
        capabilities: device.capabilities ? JSON.parse(device.capabilities) : null,
      })),
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}
