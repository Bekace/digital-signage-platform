import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!action || !["play", "pause"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    const sql = getDb()

    // Update device status
    const newStatus = action === "play" ? "playing" : "paused"
    const updatedDevices = await sql`
      UPDATE devices 
      SET 
        status = ${newStatus},
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
      RETURNING *
    `

    if (updatedDevices.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Playback ${action}d successfully`,
      device: updatedDevices[0],
    })
  } catch (error) {
    console.error("Playback control error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to control playback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
