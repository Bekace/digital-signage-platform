import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG DEVICES] Starting debug request")

    const user = await getCurrentUser(request)
    console.log("🔍 [DEBUG DEVICES] Current user:", user ? { id: user.id, email: user.email } : "No user")

    // Get all devices (not filtered by user for debugging)
    const allDevices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.user_id,
        d.created_at,
        d.updated_at,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM devices d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `

    // Get all pairing codes
    const allPairingCodes = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.device_id,
        dpc.user_id,
        dpc.used_at,
        dpc.completed_at,
        dpc.created_at,
        dpc.expires_at,
        u.email as user_email
      FROM device_pairing_codes dpc
      LEFT JOIN users u ON dpc.user_id = u.id
      ORDER BY dpc.created_at DESC
    `

    // Get devices for current user if authenticated
    let userDevices = []
    if (user) {
      userDevices = await sql`
        SELECT 
          d.id,
          d.name,
          d.device_type,
          d.status,
          d.user_id,
          d.created_at,
          d.updated_at
        FROM devices d
        WHERE d.user_id = ${user.id}
        ORDER BY d.created_at DESC
      `
    }

    console.log("🔍 [DEBUG DEVICES] Results:", {
      totalDevices: allDevices.length,
      totalPairingCodes: allPairingCodes.length,
      userDevices: userDevices.length,
      currentUserId: user?.id,
    })

    return NextResponse.json({
      success: true,
      debug: {
        currentUser: user ? { id: user.id, email: user.email } : null,
        allDevices,
        allPairingCodes,
        userDevices,
        stats: {
          totalDevices: allDevices.length,
          totalPairingCodes: allPairingCodes.length,
          userDevicesCount: userDevices.length,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG DEVICES] Error:", error)
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
