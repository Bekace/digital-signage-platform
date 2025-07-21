import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG PAIRING CODES] Starting pairing codes analysis...")

    // Get all pairing codes with their relationships
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

    // Get available (unused and not expired) pairing codes
    const availableCodes = await sql`
      SELECT *
      FROM device_pairing_codes 
      WHERE device_id IS NULL 
      AND expires_at > NOW()
      ORDER BY created_at DESC
    `

    // Count statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN expires_at > NOW() AND device_id IS NULL THEN 1 END) as active,
        COUNT(CASE WHEN device_id IS NOT NULL THEN 1 END) as used,
        COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_users,
        COUNT(CASE WHEN expires_at > NOW() AND device_id IS NULL AND user_id IS NOT NULL THEN 1 END) as available
      FROM device_pairing_codes
    `

    const analysis = {
      totalCodes: pairingCodes.length,
      activeCodes: stats[0]?.active || "0",
      usedCodes: stats[0]?.used || "0",
      expiredCodes: stats[0]?.expired || "0",
      hasUserAssociation: pairingCodes.some((code) => code.user_id !== null),
      availableForPairing: Number.parseInt(stats[0]?.available || "0"),
    }

    console.log("🔍 [DEBUG PAIRING CODES] Analysis complete:", {
      total: pairingCodes.length,
      available: analysis.availableForPairing,
      hasUsers: analysis.hasUserAssociation,
    })

    return NextResponse.json({
      success: true,
      data: {
        pairingCodes,
        pairingWithDevices,
        availableCodes,
        analysis,
        stats: stats[0],
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
