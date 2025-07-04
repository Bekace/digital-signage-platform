import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: Request) {
  try {
    console.log("Device Register API: Starting request")

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 })
    }

    const sql = getDb()

    // Find device with this code
    const devices = await sql`
      SELECT id, name, type, user_id, status
      FROM devices 
      WHERE code = ${code} AND status = 'pending'
      LIMIT 1
    `

    if (devices.length === 0) {
      console.log(`Device Register API: No pending device found with code ${code}`)
      return NextResponse.json({ success: false, error: "Invalid or expired code" }, { status: 404 })
    }

    const device = devices[0]
    console.log(`Device Register API: Found device ${device.id} with code ${code}`)

    // Update device status to online
    await sql`
      UPDATE devices 
      SET status = 'online', last_seen = NOW(), code = NULL
      WHERE id = ${device.id}
    `

    console.log(`Device Register API: Device ${device.id} registered successfully`)

    return NextResponse.json({
      success: true,
      message: "Device registered successfully",
      device: {
        id: device.id,
        name: device.name,
        type: device.type,
        status: "online",
      },
    })
  } catch (error) {
    console.error("Device Register API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to register device",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
