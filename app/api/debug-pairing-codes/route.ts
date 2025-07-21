import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG PAIRING CODES] Starting pairing codes analysis...")

    // Get all pairing codes with details
    const pairingCodes = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.screen_name,
        dpc.device_id,
        dpc.user_id,
        dpc.used_at,
        dpc.completed_at,
        dpc.created_at,
        u.email as user_email,
        d.name as device_name,
        d.status as device_status
      FROM device_pairing_codes dpc
      LEFT JOIN users u ON dpc.user_id = u.id
      LEFT JOIN devices d ON dpc.device_id = d.id
      ORDER BY dpc.created_at DESC
      LIMIT 50
    `

    // Get pairing codes schema
    const schema = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'device_pairing_codes' 
      ORDER BY ordinal_position
    `

    // Get recent pairing activity
    const recentActivity = await sql`
      SELECT 
        COUNT(*) as total_codes,
        COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as used_codes,
        COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_codes,
        COUNT(CASE WHEN device_id IS NOT NULL THEN 1 END) as codes_with_devices
      FROM device_pairing_codes
    `

    // Check for orphaned codes (codes without valid users or devices)
    const orphanedCodes = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.user_id,
        dpc.device_id,
        CASE 
          WHEN u.id IS NULL THEN 'Missing User'
          WHEN d.id IS NULL AND dpc.device_id IS NOT NULL THEN 'Missing Device'
          ELSE 'Valid'
        END as status
      FROM device_pairing_codes dpc
      LEFT JOIN users u ON dpc.user_id = u.id
      LEFT JOIN devices d ON dpc.device_id = d.id
      WHERE u.id IS NULL OR (dpc.device_id IS NOT NULL AND d.id IS NULL)
    `

    console.log("🔍 [DEBUG PAIRING CODES] Found codes:", pairingCodes.length)
    console.log("🔍 [DEBUG PAIRING CODES] Activity summary:", recentActivity[0])

    return NextResponse.json({
      success: true,
      data: {
        pairingCodes,
        schema,
        summary: recentActivity[0],
        orphanedCodes,
        analysis: {
          totalCodes: pairingCodes.length,
          hasOrphanedCodes: orphanedCodes.length > 0,
          completionRate:
            recentActivity[0]?.total_codes > 0
              ? ((recentActivity[0].completed_codes / recentActivity[0].total_codes) * 100).toFixed(1) + "%"
              : "0%",
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
