import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (code) {
      // Get devices by pairing code
      const devices = await sql`
        SELECT d.*, dpc.code as pairing_code
        FROM devices d
        LEFT JOIN device_pairing_codes dpc ON d.id = dpc.device_id
        WHERE dpc.code = ${code}
        AND dpc.expires_at > CURRENT_TIMESTAMP
      `

      return NextResponse.json({
        success: true,
        devices: devices,
      })
    }

    // Get user's token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    // Get all devices for the user
    const devices = await sql`
      SELECT d.*, p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.current_playlist_id = p.id
      WHERE d.user_id = ${decoded.userId}
      ORDER BY d.created_at DESC
    `

    return NextResponse.json({
      success: true,
      devices: devices,
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch devices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, location, description } = body

    // Get user's token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    // Generate a pairing code for the new device
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create the device
    const [device] = await sql`
      INSERT INTO devices (user_id, name, location, description, status, created_at)
      VALUES (${decoded.userId}, ${name}, ${location || ""}, ${description || ""}, 'offline', ${new Date().toISOString()})
      RETURNING *
    `

    // Create pairing code
    await sql`
      INSERT INTO device_pairing_codes (code, expires_at, device_id, created_at)
      VALUES (${pairingCode}, ${expiresAt.toISOString()}, ${device.id}, ${new Date().toISOString()})
    `

    return NextResponse.json({
      success: true,
      device: {
        ...device,
        pairingCode: pairingCode,
        pairingExpiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error creating device:", error)
    return NextResponse.json({ success: false, message: "Failed to create device" }, { status: 500 })
  }
}
