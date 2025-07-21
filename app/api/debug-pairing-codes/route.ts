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

    // Get pairing codes schema
    const pairingSchema = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'device_pairing_codes' 
      ORDER BY ordinal_position
    `

    // Check for active pairing codes
    const activeCodes = await sql`
      SELECT 
        code,
        expires_at,
        CASE 
          WHEN expires_at > NOW() THEN 'active'
          ELSE 'expired'
        END as status,
        device_id IS NOT NULL as is_used
      FROM device_pairing_codes
      ORDER BY expires_at DESC
    `

    console.log("🔍 [DEBUG PAIRING CODES] Found codes:", pairingCodes.length)
    console.log("🔍 [DEBUG PAIRING CODES] Active codes:", activeCodes.filter((c) => c.status === "active").length)

    return NextResponse.json({
      success: true,
      data: {
        pairingCodes,
        pairingSchema,
        activeCodes,
        analysis: {
          totalCodes: pairingCodes.length,
          activeCodes: activeCodes.filter((c) => c.status === "active").length,
          usedCodes: pairingCodes.filter((c) => c.device_id !== null).length,
          expiredCodes: activeCodes.filter((c) => c.status === "expired").length,
          hasUserAssociation: pairingCodes.some((c) => c.user_id !== null),
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
