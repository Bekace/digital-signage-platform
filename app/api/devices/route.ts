import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] Fetching devices...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("📱 [DEVICES API] No authenticated user")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    console.log("📱 [DEVICES API] User authenticated:", user.email)
    const sql = getDb()

    // Get devices from database
    const devices = await sql`
      SELECT device_id, screen_name, device_type, platform, status, location, 
             resolution, last_seen, registered_at 
      FROM devices 
      WHERE user_id = ${user.id} 
      ORDER BY registered_at DESC
    `

    console.log("📱 [DEVICES API] Found devices:", devices.length)

    // Update status based on last_seen
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const formattedDevices = devices.map((device) => ({
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
      total: formattedDevices.length,
      online: formattedDevices.filter((d) => d.status === "online").length,
      offline: formattedDevices.filter((d) => d.status === "offline").length,
    }

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
      ...stats,
    })
  } catch (error) {
    console.error("📱 [DEVICES API] Error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
