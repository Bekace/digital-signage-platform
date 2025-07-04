import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { deviceId: string } }) {
  try {
    console.log(`Delete Device API: Starting request for device ${params.deviceId}`)

    const user = await getCurrentUser()
    console.log("Delete Device API: User check result:", user ? `User ${user.email}` : "No user")

    if (!user) {
      console.log("Delete Device API: Authentication failed")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
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

    // Delete the device
    await sql`
      DELETE FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
    `

    console.log(`Delete Device API: Device ${params.deviceId} deleted successfully`)

    return NextResponse.json({
      success: true,
      message: "Device deleted successfully",
    })
  } catch (error) {
    console.error("Delete Device API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete device",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
