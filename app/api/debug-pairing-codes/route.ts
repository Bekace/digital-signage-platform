import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG PAIRING CODES] Starting pairing codes analysis...")

    // Get all pairing codes
    const pairingCodes = await sql`
      SELECT 
        id,
        code,
        user_id,
        device_id,
        screen_name,
        device_type,
        expires_at,
        used_at,
        completed_at,
        created_at
      FROM device_pairing_codes
      ORDER BY created_at DESC
    `

    // Get pairing codes with device relationships
    const pairingWithDevices = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.user_id,
        dpc.device_id,
        dpc.screen_name,
        dpc.device_type,
        dpc.expires_at,
        dpc.used_at,
        dpc.completed_at,
        dpc.created_at,
        d.name as device_name,
        d.status as device_status,
        d.platform as device_platform
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      ORDER BY dpc.created_at DESC
    `

    // Get active (non-expired) codes
    const activeCodes = await sql`
      SELECT COUNT(*) as count
      FROM device_pairing_codes
      WHERE expires_at > NOW()
      AND used_at IS NULL
    `

    // Get used codes
    const usedCodes = await sql`
      SELECT COUNT(*) as count
      FROM device_pairing_codes
      WHERE used_at IS NOT NULL
    `

    // Get expired codes
    const expiredCodes = await sql`
      SELECT COUNT(*) as count
      FROM device_pairing_codes
      WHERE expires_at <= NOW()
    `

    // Check for codes with user association
    const codesWithUsers = await sql`
      SELECT COUNT(*) as count
      FROM device_pairing_codes
      WHERE user_id IS NOT NULL
    `

    // Get codes that should be available for pairing
    const availableCodes = await sql`
      SELECT 
        code,
        expires_at,
        screen_name,
        device_type,
        EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 as minutes_until_expiry
      FROM device_pairing_codes
      WHERE expires_at > NOW()
      AND used_at IS NULL
      AND device_id IS NULL
      ORDER BY expires_at ASC
    `

    const analysis = {
      totalCodes: pairingCodes.length,
      activeCodes: activeCodes[0].count,
      usedCodes: usedCodes[0].count,
      expiredCodes: expiredCodes[0].count,
      hasUserAssociation: codesWithUsers[0].count > 0,
      availableForPairing: availableCodes.length,
    }

    console.log("🔍 [DEBUG PAIRING CODES] Analysis complete:", analysis)

    return NextResponse.json({
      success: true,
      data: {
        pairingCodes,
        pairingWithDevices,
        availableCodes,
        analysis,
        stats: {
          total: pairingCodes.length,
          active: activeCodes[0].count,
          used: usedCodes[0].count,
          expired: expiredCodes[0].count,
          withUsers: codesWithUsers[0].count,
          available: availableCodes.length,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PAIRING CODES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze pairing codes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
