import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const devices = await sql`
      SELECT * FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
      LIMIT 1
    `

    if (devices.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device: devices[0],
    })
  } catch (error) {
    console.error("Get device error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, notes, orientation, brightness, volume, auto_restart, restart_time } = body

    const sql = getDb()

    // Update device settings
    const updatedDevices = await sql`
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
      RETURNING *
    `

    if (updatedDevices.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device: updatedDevices[0],
    })
  } catch (error) {
    console.error("Update device error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    const deletedDevices = await sql`
      DELETE FROM devices 
      WHERE id = ${params.deviceId} AND user_id = ${user.id}
      RETURNING *
    `

    if (deletedDevices.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Device deleted successfully",
    })
  } catch (error) {
    console.error("Delete device error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
