import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 },
      )
    }

    const deviceId = params.deviceId

    console.log("Deleting device:", deviceId, "for user:", user.email)

    const sql = getDb()

    // Check if device belongs to user
    const devices = await sql`
      SELECT id FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (devices.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Device not found or access denied",
        },
        { status: 404 },
      )
    }

    // Delete the device
    await sql`
      DELETE FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    console.log("Device deleted successfully:", deviceId)

    return NextResponse.json({
      success: true,
      message: "Device deleted successfully",
    })
  } catch (error) {
    console.error("Delete device error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to delete device",
      },
      { status: 500 },
    )
  }
}
