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

    // Get pairing codes with device information
    const pairingWithDevices = await sql`
      SELECT 
        dpc.*,
        d.name as device_name,
        d.status as device_status,
        d.platform as device_platform
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      ORDER BY dpc.created_at DESC
    `

    // Get available codes (not expired, not used)
    const availableCodes = await sql`
      SELECT *
      FROM device_pairing_codes
      WHERE expires_at > NOW()
      AND device_id IS NULL
      ORDER BY created_at DESC
    `

    // Analysis
    const totalCodes = pairingCodes.length
    const activeCodes = await sql`SELECT COUNT(*) as count FROM device_pairing_codes WHERE expires_at > NOW()`
    const usedCodes = await sql`SELECT COUNT(*) as count FROM device_pairing_codes WHERE device_id IS NOT NULL`
    const expiredCodes = await sql`SELECT COUNT(*) as count FROM device_pairing_codes WHERE expires_at <= NOW()`
    const hasUserAssociation = pairingCodes.some((code) => code.user_id !== null)
    const availableForPairing = availableCodes.length

    console.log("🔍 [DEBUG PAIRING CODES] Analysis complete:", {
      totalCodes,
      activeCodes: activeCodes[0].count,
      usedCodes: usedCodes[0].count,
      expiredCodes: expiredCodes[0].count,
      hasUserAssociation,
      availableForPairing,
    })

    return NextResponse.json({
      success: true,
      data: {
        pairingCodes,
        pairingWithDevices,
        availableCodes,
        analysis: {
          totalCodes,
          activeCodes: activeCodes[0].count,
          usedCodes: usedCodes[0].count,
          expiredCodes: expiredCodes[0].count,
          hasUserAssociation,
          availableForPairing,
        },
        stats: {
          total: totalCodes,
          active: activeCodes[0].count,
          used: usedCodes[0].count,
          expired: expiredCodes[0].count,
          withUsers: pairingCodes.filter((code) => code.user_id !== null).length.toString(),
          available: availableForPairing,
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
