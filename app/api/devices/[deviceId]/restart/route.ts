import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if device exists and belongs to user
    const devices = await sql`
      SELECT * FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (devices.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    // Update device with restart command
    await sql`
      UPDATE devices 
      SET 
        status = 'restarting',
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
    `

    // In a real implementation, you would send a restart command to the device
    // For now, we'll just update the status and simulate the restart

    return NextResponse.json({
      success: true,
      message: "Restart command sent to device",
    })
  } catch (error) {
    console.error("Restart device error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restart device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
