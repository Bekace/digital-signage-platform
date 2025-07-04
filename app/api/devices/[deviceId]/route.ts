import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = params.deviceId
    const body = await request.json()

    const { name, location, notes, orientation, brightness, volume, auto_restart, restart_time } = body

    const sql = getDb()

    // Update device settings
    const result = await sql`
      UPDATE devices 
      SET 
        name = COALESCE(${name}, name),
        location = COALESCE(${location}, location),
        notes = COALESCE(${notes}, notes),
        orientation = COALESCE(${orientation}, orientation),
        brightness = COALESCE(${brightness}, brightness),
        volume = COALESCE(${volume}, volume),
        auto_restart = COALESCE(${auto_restart}, auto_restart),
        restart_time = COALESCE(${restart_time}, restart_time),
        updated_at = NOW()
      WHERE id = ${deviceId} AND user_id = ${user.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device: result[0],
    })
  } catch (error) {
    console.error("Update device error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const deviceId = params.deviceId
    const sql = getDb()

    const result = await sql`
      DELETE FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Device deleted successfully",
    })
  } catch (error) {
    console.error("Delete device error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
