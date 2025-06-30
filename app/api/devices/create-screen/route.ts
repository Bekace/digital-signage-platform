import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("📺 [CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📺 [CREATE SCREEN] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("📺 [CREATE SCREEN] Request:", { pairingCode, userId: user.id })

    if (!pairingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code is required",
        },
        { status: 400 },
      )
    }

    // Check if the pairing code exists and has a connected device
    const pairingRecord = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.expires_at,
        dpc.used_at,
        d.id as device_id,
        d.name as device_name,
        d.status as device_status,
        d.device_id as device_identifier
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON d.pairing_code = dpc.code
      WHERE dpc.code = ${pairingCode}
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > NOW()
    `

    if (pairingRecord.length === 0) {
      console.log("📺 [CREATE SCREEN] Pairing code not found or expired")
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code not found or expired",
        },
        { status: 400 },
      )
    }

    const record = pairingRecord[0]

    if (!record.device_id) {
      console.log("📺 [CREATE SCREEN] No device connected to pairing code")
      return NextResponse.json(
        {
          success: false,
          error: "No device connected to this pairing code",
        },
        { status: 400 },
      )
    }

    if (record.used_at) {
      console.log("📺 [CREATE SCREEN] Pairing code already used")
      return NextResponse.json(
        {
          success: false,
          error: "This pairing code has already been used",
        },
        { status: 400 },
      )
    }

    // Update the device with the screen name and mark as active
    await sql`
      UPDATE devices 
      SET 
        name = ${record.screen_name},
        status = 'active',
        updated_at = NOW()
      WHERE id = ${record.device_id}
    `

    // Mark the pairing code as used
    await sql`
      UPDATE device_pairing_codes 
      SET 
        used_at = NOW(),
        updated_at = NOW()
      WHERE id = ${record.pairing_id}
    `

    console.log("📺 [CREATE SCREEN] Screen created successfully:", {
      deviceId: record.device_id,
      screenName: record.screen_name,
      deviceType: record.device_type,
    })

    return NextResponse.json({
      success: true,
      device: {
        id: record.device_id,
        name: record.screen_name,
        deviceType: record.device_type,
        status: "active",
        deviceIdentifier: record.device_identifier,
      },
      message: "Screen created successfully",
    })
  } catch (error) {
    console.error("📺 [CREATE SCREEN] Error:", error)
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
