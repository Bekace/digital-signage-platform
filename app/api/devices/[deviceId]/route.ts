import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = Number.parseInt(params.deviceId)
    if (isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "Invalid device ID" }, { status: 400 })
    }

    console.log("📱 [GET DEVICE] Fetching device:", { deviceId, userId: user.id })

    const deviceResult = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.platform,
        d.capabilities,
        d.screen_resolution,
        d.user_id,
        d.assigned_playlist_id,
        d.playlist_status,
        d.last_seen,
        d.created_at,
        d.updated_at,
        p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.id = ${deviceId} AND d.user_id = ${user.id}
    `

    if (deviceResult.length === 0) {
      console.log("📱 [GET DEVICE] Device not found or access denied")
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]

    console.log("📱 [GET DEVICE] Device found:", device.name)

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        status: device.status,
        platform: device.platform,
        capabilities: device.capabilities,
        screenResolution: device.screen_resolution,
        assignedPlaylistId: device.assigned_playlist_id,
        playlistStatus: device.playlist_status,
        playlistName: device.playlist_name,
        lastSeen: device.last_seen,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
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

export async function PUT(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = Number.parseInt(params.deviceId)
    if (isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "Invalid device ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, status } = body

    console.log("📱 [UPDATE DEVICE] Updating device:", { deviceId, name, status, userId: user.id })

    const updateResult = await sql`
      UPDATE devices 
      SET 
        name = COALESCE(${name}, name),
        status = COALESCE(${status}, status),
        updated_at = NOW()
      WHERE id = ${deviceId} AND user_id = ${user.id}
      RETURNING id, name, device_type, status, updated_at
    `

    if (updateResult.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found or access denied" }, { status: 404 })
    }

    console.log("📱 [UPDATE DEVICE] Device updated successfully")

    return NextResponse.json({
      success: true,
      device: updateResult[0],
      message: "Device updated successfully",
    })
  } catch (error) {
    console.error("📱 [UPDATE DEVICE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = Number.parseInt(params.deviceId)
    if (isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "Invalid device ID" }, { status: 400 })
    }

    console.log("📱 [DELETE DEVICE] Deleting device:", { deviceId, userId: user.id })

    // Delete device heartbeats first
    await sql`
      DELETE FROM device_heartbeats 
      WHERE device_id = ${deviceId}
    `

    // Clear pairing code links
    await sql`
      UPDATE device_pairing_codes 
      SET device_id = NULL 
      WHERE device_id = ${deviceId}
    `

    // Delete the device
    const deleteResult = await sql`
      DELETE FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
      RETURNING id, name
    `

    if (deleteResult.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found or access denied" }, { status: 404 })
    }

    console.log("📱 [DELETE DEVICE] Device deleted successfully:", deleteResult[0].name)

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
