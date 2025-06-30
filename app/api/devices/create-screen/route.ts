import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("[CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode, screenName, location, description } = body

    console.log("[CREATE SCREEN] Creating screen with:", { pairingCode, screenName, location })

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Find the pairing code and associated device
    const pairingResult = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.device_id,
        d.id as device_id,
        d.name as device_name,
        d.device_type as device_device_type,
        d.status as device_status
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.id = dpc.device_id
      WHERE dpc.code = ${pairingCode}
      AND dpc.expires_at > NOW()
      AND dpc.completed_at IS NOT NULL
      ORDER BY dpc.created_at DESC
      LIMIT 1
    `

    if (pairingResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid pairing code or device not connected",
      })
    }

    const pairing = pairingResult[0]

    if (!pairing.device_id) {
      return NextResponse.json({
        success: false,
        error: "Device not connected yet",
      })
    }

    // Update device with screen information
    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        name = ${screenName || pairing.screen_name},
        location = ${location || ""},
        description = ${description || ""},
        status = 'online',
        user_id = ${user.id}
      WHERE id = ${pairing.device_id}
      RETURNING id, name, device_type, status, location, description, created_at
    `

    if (updatedDevice.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Failed to update device",
      })
    }

    const screen = updatedDevice[0]

    console.log("[CREATE SCREEN] Screen created successfully:", screen)

    return NextResponse.json({
      success: true,
      screen: {
        id: screen.id,
        name: screen.name,
        type: screen.device_type,
        status: screen.status,
        location: screen.location,
        description: screen.description,
        createdAt: screen.created_at,
      },
      message: "Screen created successfully",
    })
  } catch (error) {
    console.error("[CREATE SCREEN] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create screen",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
