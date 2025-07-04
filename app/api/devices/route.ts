import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
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

    console.log("Fetching devices for user:", user.email)

    const sql = getDb()

    // Get devices for the current user
    const devices = await sql`
      SELECT 
        id,
        name as screenName,
        type as deviceType,
        location,
        status,
        resolution,
        last_seen as lastSeen,
        created_at
      FROM devices 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    console.log(`Found ${devices.length} devices for user ${user.email}`)

    // Format devices for frontend
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      screenName: device.screenName,
      deviceType: device.deviceType,
      location: device.location,
      status: device.status,
      resolution: device.resolution || "1920x1080",
      lastSeen: device.lastSeen || device.created_at,
    }))

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
      message: "Devices fetched successfully",
    })
  } catch (error) {
    console.error("Fetch devices error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to fetch devices",
      },
      { status: 500 },
    )
  }
}
