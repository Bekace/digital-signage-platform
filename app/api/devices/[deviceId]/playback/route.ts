import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = params.deviceId
    const body = await request.json()
    const { action } = body

    if (!action || !["play", "pause"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action. Must be 'play' or 'pause'" }, { status: 400 })
    }

    const sql = getDb()

    // Update device status
    const result = await sql`
      UPDATE devices 
      SET 
        status = ${action === "play" ? "playing" : "paused"},
        updated_at = NOW()
      WHERE id = ${deviceId} AND user_id = ${user.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found or access denied" }, { status: 404 })
    }

    // In a real implementation, you would send a command to the actual device here
    // For now, we just update the database status

    return NextResponse.json({
      success: true,
      message: `Device ${action} command sent successfully`,
      device: result[0],
    })
  } catch (error) {
    console.error("Playback control error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
