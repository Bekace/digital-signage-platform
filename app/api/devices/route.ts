import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const sql = getDb()

    // For demo, use user ID 1
    const userId = 1

    // Get devices from database
    const result = await sql`
      SELECT device_id, screen_name, device_type, platform, status, location, 
             resolution, last_seen, registered_at 
      FROM devices 
      WHERE user_id = ${userId} 
      ORDER BY registered_at DESC
    `

    // Update status based on last_seen
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const devices = result.map((device) => ({
      id: device.device_id,
      screenName: device.screen_name,
      deviceType: device.device_type,
      platform: device.platform,
      status: new Date(device.last_seen) < fiveMinutesAgo ? "offline" : device.status,
      location: device.location,
      resolution: device.resolution,
      lastSeen: device.last_seen,
      registeredAt: device.registered_at,
    }))

    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
    }

    return NextResponse.json({
      success: true,
      devices: devices,
      ...stats,
    })
  } catch (error) {
    console.error("Get devices error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
