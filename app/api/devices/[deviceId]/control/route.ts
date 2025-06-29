import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎮 [DEVICE CONTROL] Starting device control...")

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ [DEVICE CONTROL] No authorization header")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()
    const deviceId = params.deviceId

    console.log(`🎮 [DEVICE CONTROL] Device: ${deviceId}, Action: ${action}`)

    if (!action || !["play", "pause", "stop", "restart"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    const sql = getDb()
    const userId = 1 // For demo, use user ID 1

    // Verify device belongs to user and is online
    const deviceCheck = await sql`
      SELECT device_id, status, assigned_playlist_id FROM devices 
      WHERE device_id = ${deviceId} AND user_id = ${userId}
    `

    if (deviceCheck.length === 0) {
      console.log("❌ [DEVICE CONTROL] Device not found or not owned by user")
      return NextResponse.json({ success: false, message: "Device not found" }, { status: 404 })
    }

    const device = deviceCheck[0]

    if (device.status === "offline") {
      console.log("❌ [DEVICE CONTROL] Device is offline")
      return NextResponse.json({ success: false, message: "Device is offline" }, { status: 400 })
    }

    if (!device.assigned_playlist_id && action !== "stop") {
      console.log("❌ [DEVICE CONTROL] No playlist assigned")
      return NextResponse.json({ success: false, message: "No playlist assigned to device" }, { status: 400 })
    }

    // Map actions to playlist status
    const statusMap = {
      play: "playing",
      pause: "paused",
      stop: "stopped",
      restart: "playing",
    }

    // Update device control status
    await sql`
      UPDATE devices 
      SET playlist_status = ${statusMap[action]},
          last_control_action = ${action},
          last_control_time = NOW(),
          updated_at = NOW()
      WHERE device_id = ${deviceId} AND user_id = ${userId}
    `

    console.log(`✅ [DEVICE CONTROL] Device ${action} command sent successfully`)

    // In a real implementation, you would send the control command to the actual device
    // For now, we just update the database status

    return NextResponse.json({
      success: true,
      message: `Device ${action} command sent successfully`,
      action: action,
      status: statusMap[action],
    })
  } catch (error) {
    console.error("❌ [DEVICE CONTROL] Error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
