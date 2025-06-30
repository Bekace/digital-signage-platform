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

    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.platform,
        d.status,
        d.playlist_status,
        d.assigned_playlist_id,
        d.last_seen,
        d.created_at,
        d.updated_at,
        p.name as playlist_name,
        dh.status as heartbeat_status,
        dh.updated_at as last_heartbeat
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      LEFT JOIN device_heartbeats dh ON d.id = dh.device_id
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    const formattedDevices = devices.map((device) => ({
      id: device.id,
      name: device.name,
      type: device.device_type,
      platform: device.platform,
      status: device.status,
      playlistStatus: device.playlist_status,
      assignedPlaylist: device.playlist_name,
      lastSeen: device.last_seen,
      lastHeartbeat: device.last_heartbeat,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
    }))

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
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
    const { name, deviceType, platform, capabilities = [] } = body

    if (!name || !deviceType) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and device type are required",
        },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO devices (
        user_id,
        name,
        device_type,
        platform,
        capabilities,
        status,
        playlist_status,
        created_at,
        updated_at
      )
      VALUES (
        ${user.id},
        ${name},
        ${deviceType},
        ${platform || "unknown"},
        ${JSON.stringify(capabilities)},
        'offline',
        'none',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, name, device_type, platform, status, created_at
    `

    return NextResponse.json({
      success: true,
      device: {
        id: result[0].id,
        name: result[0].name,
        type: result[0].device_type,
        platform: result[0].platform,
        status: result[0].status,
        createdAt: result[0].created_at,
      },
    })
  } catch (error) {
    console.error("Error creating device:", error)
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
