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
    const sql = getDb()

    // Check if device exists and belongs to user
    const device = await sql`
      SELECT * FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    if (device.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found or access denied" }, { status: 404 })
    }

    // Update device status to indicate restart is pending
    await sql`
      UPDATE devices 
      SET 
        status = 'offline',
        updated_at = NOW()
      WHERE id = ${deviceId}
    `

    // In a real implementation, you would send a restart command to the actual device here
    // For now, we just simulate the restart by updating the status

    // Simulate device coming back online after restart (in a real app, the device would do this)
    setTimeout(async () => {
      try {
        await sql`
          UPDATE devices 
          SET 
            status = 'online',
            last_seen = NOW()
          WHERE id = ${deviceId}
        `
      } catch (error) {
        console.error("Error updating device status after restart:", error)
      }
    }, 5000) // Simulate 5 second restart time

    return NextResponse.json({
      success: true,
      message: "Device restart command sent successfully",
    })
  } catch (error) {
    console.error("Restart device error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
