import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("📺 [CREATE SCREEN] Request:", { pairingCode, userId: user.id })

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Verify the pairing code and get device info
    const pairingResult = await sql`
      SELECT 
        dpc.id as pairing_id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.device_id,
        d.id as device_id,
        d.name as device_name,
        d.status as device_status
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      WHERE dpc.code = ${pairingCode} 
      AND dpc.user_id = ${user.id}
      AND dpc.expires_at > CURRENT_TIMESTAMP
      AND dpc.used_at IS NOT NULL
      AND dpc.device_id IS NOT NULL
    `

    console.log("📺 [CREATE SCREEN] Pairing lookup:", pairingResult)

    if (pairingResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Device not connected or pairing code invalid",
      })
    }

    const pairing = pairingResult[0]

    // Update the device with proper screen information
    const deviceResult = await sql`
      UPDATE devices 
      SET 
        name = ${pairing.screen_name},
        device_type = ${pairing.device_type},
        user_id = ${user.id},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${pairing.device_id}
      RETURNING id, name, device_type, status, created_at, updated_at
    `

    console.log("📺 [CREATE SCREEN] Device update result:", deviceResult)

    if (deviceResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Failed to create screen",
      })
    }

    const screen = deviceResult[0]

    // Mark pairing as completed
    await sql`
      UPDATE device_pairing_codes 
      SET completed_at = CURRENT_TIMESTAMP
      WHERE code = ${pairingCode}
    `

    console.log("✅ [CREATE SCREEN] Screen created successfully:", screen)

    return NextResponse.json({
      success: true,
      screen: {
        id: screen.id,
        name: screen.name,
        deviceType: screen.device_type,
        status: screen.status,
        createdAt: screen.created_at,
        updatedAt: screen.updated_at,
      },
      message: "Screen created successfully",
    })
  } catch (error) {
    console.error("❌ [CREATE SCREEN] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create screen",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
