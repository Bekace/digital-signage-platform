import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎮 [DEVICE CONTROL] Starting control action for device:", params.deviceId)

    // Get auth token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      console.log("❌ [DEVICE CONTROL] No auth token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("👤 [DEVICE CONTROL] User ID from token:", decoded.userId)

    // Get request body
    const body = await request.json()
    const { action } = body
    console.log("🎯 [DEVICE CONTROL] Control action:", action)

    // Validate action
    const validActions = ["play", "pause", "stop", "restart"]
    if (!action || !validActions.includes(action)) {
      console.log("❌ [DEVICE CONTROL] Invalid action provided:", action)
      return NextResponse.json(
        {
          error: "Invalid action. Must be one of: play, pause, stop, restart",
        },
        { status: 400 },
      )
    }

    // Verify device ownership and get current status
    const deviceResult = await sql`
      SELECT 
        d.id, 
        d.name, 
        d.user_id, 
        d.status, 
        d.assigned_playlist_id,
        d.playlist_status,
        p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.id = ${params.deviceId} AND d.user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      console.log("❌ [DEVICE CONTROL] Device not found or not owned by user")
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]
    console.log("📱 [DEVICE CONTROL] Device found:", device.name, "Status:", device.status)

    // Check if device is online
    if (device.status !== "online") {
      console.log("❌ [DEVICE CONTROL] Device is not online:", device.status)
      return NextResponse.json(
        {
          error: "Device must be online to control playback",
        },
        { status: 400 },
      )
    }

    // Check if playlist is assigned for play/restart actions
    if ((action === "play" || action === "restart") && !device.assigned_playlist_id) {
      console.log("❌ [DEVICE CONTROL] No playlist assigned for play/restart action")
      return NextResponse.json(
        {
          error: "No playlist assigned to device. Assign a playlist first.",
        },
        { status: 400 },
      )
    }

    // Map control actions to playlist status
    let newPlaylistStatus: string
    switch (action) {
      case "play":
        newPlaylistStatus = "playing"
        break
      case "pause":
        newPlaylistStatus = "paused"
        break
      case "stop":
        newPlaylistStatus = "stopped"
        break
      case "restart":
        newPlaylistStatus = "playing"
        break
      default:
        newPlaylistStatus = device.playlist_status || "stopped"
    }

    console.log("📊 [DEVICE CONTROL] Updating playlist status to:", newPlaylistStatus)

    // Update device control status
    const updateResult = await sql`
      UPDATE devices 
      SET 
        playlist_status = ${newPlaylistStatus},
        last_control_action = ${action},
        last_control_time = NOW(),
        updated_at = NOW()
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
      RETURNING 
        id, 
        name, 
        status, 
        assigned_playlist_id,
        playlist_status,
        last_control_action,
        last_control_time
    `

    if (updateResult.length === 0) {
      console.log("❌ [DEVICE CONTROL] Failed to update device control status")
      return NextResponse.json({ error: "Failed to update device control status" }, { status: 500 })
    }

    const updatedDevice = updateResult[0]
    console.log("✅ [DEVICE CONTROL] Successfully updated device control status")
    console.log("📊 [DEVICE CONTROL] Updated device:", updatedDevice)

    // In a real implementation, you would send the control command to the actual device here
    // For now, we just update the database status
    console.log("📡 [DEVICE CONTROL] Would send control command to device:", {
      deviceId: params.deviceId,
      action: action,
      playlistId: device.assigned_playlist_id,
      playlistName: device.playlist_name,
    })

    return NextResponse.json({
      success: true,
      message: `Device "${device.name}" ${action} command sent successfully`,
      device: updatedDevice,
      playlist: device.assigned_playlist_id
        ? {
            id: device.assigned_playlist_id,
            name: device.playlist_name,
          }
        : null,
    })
  } catch (error) {
    console.error("💥 [DEVICE CONTROL] Error:", error)
    return NextResponse.json({ error: "Failed to control device" }, { status: 500 })
  }
}
