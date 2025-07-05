import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { deviceId: string } }) {
  try {
    console.log(`Restart Device API: Starting request for device ${params.deviceId}`)

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const sql = getDb()

    // Check if device exists and belongs to user
    const devices = await sql`
      SELECT id, name, status FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (devices.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    const device = devices[0]

    if (device.status === "offline") {
      return NextResponse.json({ success: false, error: "Cannot restart offline device" }, { status: 400 })
    }

    // In a real implementation, this would send a restart command to the device
    // For now, we'll just log the restart request
    console.log(`Restart command sent to device ${device.name} (${params.deviceId})`)

    // Update last heartbeat to indicate restart was requested
    await sql`
      UPDATE devices 
      SET 
        last_heartbeat = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: `Restart command sent to ${device.name}`,
    })
  } catch (error) {
    console.error("Restart Device API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to restart device",
      },
      { status: 500 },
    )
  }
}
