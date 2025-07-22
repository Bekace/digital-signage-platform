import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = params.deviceId
    console.log("📱 [GET DEVICE] Fetching device:", deviceId)

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Device ID is required" }, { status: 400 })
    }

    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.platform,
        d.capabilities,
        d.screen_resolution,
        d.status,
        d.assigned_playlist_id,
        d.playlist_status,
        d.last_seen,
        d.created_at,
        d.updated_at,
        d.user_id,
        p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.id = ${deviceId}
    `

    if (devices.length === 0) {
      console.log("📱 [GET DEVICE] Device not found:", deviceId)
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    const device = devices[0]
    console.log("📱 [GET DEVICE] Found device:", device.name)

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        platform: device.platform,
        capabilities: device.capabilities,
        screenResolution: device.screen_resolution,
        status: device.status,
        assignedPlaylistId: device.assigned_playlist_id,
        playlistStatus: device.playlist_status,
        playlistName: device.playlist_name,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
        userId: device.user_id,
      },
    })
  } catch (error) {
    console.error("📱 [GET DEVICE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = params.deviceId
    console.log("📱 [DELETE DEVICE] Deleting device:", deviceId)

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Device ID is required" }, { status: 400 })
    }

    // Delete the device
    const result = await sql`
      DELETE FROM devices 
      WHERE id = ${deviceId}
      RETURNING id, name
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    console.log("📱 [DELETE DEVICE] Device deleted:", result[0].name)

    return NextResponse.json({
      success: true,
      message: "Device deleted successfully",
    })
  } catch (error) {
    console.error("📱 [DELETE DEVICE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
