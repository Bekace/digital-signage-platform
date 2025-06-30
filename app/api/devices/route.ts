import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] ===== STARTING GET REQUEST =====")
    console.log("📱 [DEVICES API] Request URL:", request.url)
    console.log("📱 [DEVICES API] Request method:", request.method)

    // Log all headers for debugging
    const headers = Object.fromEntries(request.headers.entries())
    console.log("📱 [DEVICES API] All request headers:", headers)

    // Specifically check for authorization header
    const authHeader = request.headers.get("authorization")
    console.log(
      "📱 [DEVICES API] Authorization header:",
      authHeader ? `${authHeader.substring(0, 20)}...` : "NOT FOUND",
    )

    console.log("📱 [DEVICES API] Calling getCurrentUser...")
    const user = await getCurrentUser(request)

    if (!user) {
      console.log("❌ [DEVICES API] getCurrentUser returned null - unauthorized")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          debug: "No user found in getCurrentUser()",
        },
        { status: 401 },
      )
    }

    console.log(`✅ [DEVICES API] User authenticated: ${user.email} (ID: ${user.id})`)

    // Get devices for this user
    console.log(`📱 [DEVICES API] Querying devices for user ${user.id}...`)
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.last_seen,
        d.user_id,
        d.created_at,
        d.updated_at
      FROM devices d
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    console.log(`📱 [DEVICES API] Database query completed. Found ${devices.length} devices`)
    console.log("📱 [DEVICES API] Raw devices data:", JSON.stringify(devices, null, 2))

    // Calculate statistics
    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === "online").length,
      offline: devices.filter((d) => d.status === "offline").length,
      playing: devices.filter((d) => d.status === "playing").length,
    }
    console.log("📱 [DEVICES API] Calculated stats:", stats)

    // Format devices for response
    const formattedDevices = devices.map((device) => {
      const formatted = {
        id: device.id,
        name: device.name || `Device ${device.id}`,
        deviceType: device.device_type || "unknown",
        status: device.status === "online" ? "online" : "offline",
        lastSeen: device.last_seen || device.updated_at || device.created_at,
        assignedPlaylistId: null,
        playlistStatus: "none",
        lastControlAction: null,
        lastControlTime: null,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
        playlist: null,
      }
      console.log(`📱 [DEVICES API] Formatted device ${device.id}:`, formatted)
      return formatted
    })

    const response = {
      success: true,
      devices: formattedDevices,
      stats,
    }

    console.log("✅ [DEVICES API] Final response:", JSON.stringify(response, null, 2))
    console.log("📱 [DEVICES API] ===== REQUEST COMPLETE =====")

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [DEVICES API] CRITICAL ERROR:", error)
    console.error("❌ [DEVICES API] Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("❌ [DEVICES API] Error message:", error instanceof Error ? error.message : "Unknown")
    console.error("❌ [DEVICES API] Error stack:", error instanceof Error ? error.stack : "No stack")

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch devices",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: "Check server logs for full error details",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📱 [DEVICES API] POST request received")

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, description } = body

    console.log(`📱 [DEVICES API] Creating device for user ${user.id}:`, { name, location, description })

    // Generate a pairing code for the new device
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create the device
    const deviceResult = await sql`
      INSERT INTO devices (user_id, name, device_type, status, created_at, updated_at)
      VALUES (${user.id}, ${name}, 'unknown', 'offline', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `

    if (deviceResult.length === 0) {
      throw new Error("Failed to create device")
    }

    const device = deviceResult[0]

    // Create pairing code
    await sql`
      INSERT INTO device_pairing_codes (code, expires_at, device_id, user_id, screen_name, created_at)
      VALUES (${pairingCode}, ${expiresAt.toISOString()}, ${device.id}, ${user.id}, ${name}, CURRENT_TIMESTAMP)
    `

    console.log(`✅ [DEVICES API] Device created:`, device)

    return NextResponse.json({
      success: true,
      device: {
        ...device,
        pairingCode: pairingCode,
        pairingExpiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [DEVICES API] Error creating device:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
