import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

function generatePairingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🔧 [REPAIR DEVICE] Starting device repair...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🔧 [REPAIR DEVICE] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { deviceId } = params
    console.log("🔧 [REPAIR DEVICE] Request:", { deviceId, userId: user.id })

    // Verify device belongs to user
    const deviceCheck = await sql`
      SELECT id, name, device_type, platform
      FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    if (deviceCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    const device = deviceCheck[0]

    // Generate a unique pairing code
    let pairingCode = ""
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      pairingCode = generatePairingCode()

      const existing = await sql`
        SELECT id FROM device_pairing_codes 
        WHERE code = ${pairingCode} 
        AND expires_at > NOW()
      `

      isUnique = existing.length === 0
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate unique pairing code",
        },
        { status: 500 },
      )
    }

    // Insert the pairing code into the database
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    const insertResult = await sql`
      INSERT INTO device_pairing_codes (
        code, 
        screen_name, 
        device_type, 
        user_id, 
        device_id,
        expires_at,
        created_at
      ) VALUES (
        ${pairingCode},
        ${device.name},
        ${device.device_type},
        ${user.id},
        ${deviceId},
        ${expiresAt.toISOString()},
        NOW()
      )
      RETURNING id, code, screen_name, device_type, expires_at, created_at
    `

    const pairingRecord = insertResult[0]

    console.log("🔧 [REPAIR DEVICE] Re-pairing code created:", {
      code: pairingRecord.code,
      deviceId: deviceId,
      screenName: pairingRecord.screen_name,
      deviceType: pairingRecord.device_type,
      expiresAt: pairingRecord.expires_at,
    })

    return NextResponse.json({
      success: true,
      pairingCode: pairingRecord.code,
      code: pairingRecord.code, // For backward compatibility
      deviceId: deviceId,
      screenName: pairingRecord.screen_name,
      deviceType: pairingRecord.device_type,
      expiresAt: pairingRecord.expires_at,
      message: "Re-pairing code generated successfully",
    })
  } catch (error) {
    console.error("🔧 [REPAIR DEVICE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate re-pairing code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
