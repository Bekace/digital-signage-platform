import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { deviceId: string } }) {
  try {
    console.log(`Playback Control API: Starting request for device ${params.deviceId}`)

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!action || !["playing", "paused"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'playing' or 'paused'" },
        { status: 400 },
      )
    }

    const sql = getDb()

    // Check if device exists and belongs to user
    const devices = await sql`
      SELECT id, name FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (devices.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    // Update device status
    await sql`
      UPDATE devices 
      SET 
        status = ${action},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
    `

    console.log(`Playback Control API: Device ${params.deviceId} status updated to ${action}`)

    return NextResponse.json({
      success: true,
      message: `Device playback ${action}`,
      status: action,
    })
  } catch (error) {
    console.error("Playback Control API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to control playback",
      },
      { status: 500 },
    )
  }
}
