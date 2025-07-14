import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG SCREENS] Starting debug flow...")

    const user = await getCurrentUser(request)
    const sql = getDb()

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      devices: [],
      pairingCodes: [],
      errors: [],
    }

    // Check devices table
    try {
      const devices = await sql`
        SELECT id, name, user_id, status, created_at, last_heartbeat
        FROM devices
        ORDER BY created_at DESC
        LIMIT 10
      `
      debugInfo.devices = devices
    } catch (error) {
      debugInfo.errors.push(`Devices query error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    // Check pairing codes
    try {
      const pairingCodes = await sql`
        SELECT code, user_id, device_id, expires_at, created_at
        FROM device_pairing_codes
        ORDER BY created_at DESC
        LIMIT 10
      `
      debugInfo.pairingCodes = pairingCodes
    } catch (error) {
      debugInfo.errors.push(`Pairing codes query error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    console.log("🔍 [DEBUG SCREENS] Debug complete")

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("🔍 [DEBUG SCREENS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
