import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎮 [DEVICE CONTROL] Starting control action for device:", params.deviceId)

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ [DEVICE CONTROL] No valid authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("✅ [DEVICE CONTROL] User authenticated:", decoded.userId)

    const { action } = await request.json()
    console.log("🎮 [DEVICE CONTROL] Control action:", action)

    // Validate action
    const validActions = ["play", "pause", "stop", "restart"]
    if (!validActions.includes(action)) {
      console.log("❌ [DEVICE CONTROL] Invalid action:", action)
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get device info
    const deviceResult = await sql`
      SELECT id, name, status, assigned_playlist_id, playlist_status, user_id
      FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      console.log("❌ [DEVICE CONTROL] Device not found or not owned by user")
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]
    console.log("✅ [DEVICE CONTROL] Device found:", device.name, "Status:", device.status)

    // Check if device is online
    if (device.status !== "online") {
      console.log("❌ [DEVICE CONTROL] Device is not online:", device.status)
      return NextResponse.json({ error: "Device is not online" }, { status: 400 })
    }

    // Check if device has assigned playlist for play/restart actions
    if ((action === "play" || action === "restart") && !device.assigned_playlist_id) {
      console.log("❌ [DEVICE CONTROL] No playlist assigned for play/restart action")
      return NextResponse.json({ error: "No playlist assigned to device" }, { status: 400 })
    }

    // Map action to playlist status
    let newPlaylistStatus = device.playlist_status
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
    }

    console.log("🎮 [DEVICE CONTROL] Updating playlist status to:", newPlaylistStatus)

    // Update device with control action
    const updateResult = await sql`
      UPDATE devices 
      SET playlist_status = ${newPlaylistStatus},
          last_control_action = ${action},
          last_control_time = NOW(),
          updated_at = NOW()
      WHERE id = ${params.deviceId} AND user_id = ${decoded.userId}
      RETURNING id, name, playlist_status, last_control_action, last_control_time
    `

    if (updateResult.length === 0) {
      console.log("❌ [DEVICE CONTROL] Failed to update device")
      return NextResponse.json({ error: "Failed to execute control action" }, { status: 500 })
    }

    console.log("✅ [DEVICE CONTROL] Control action executed successfully:", updateResult[0])

    return NextResponse.json({
      success: true,
      message: `Device ${action} command executed successfully`,
      device: updateResult[0],
      action: action,
    })
  } catch (error) {
    console.error("❌ [DEVICE CONTROL] Error:", error)
    return NextResponse.json({ error: "Failed to execute control action" }, { status: 500 })
  }
}
