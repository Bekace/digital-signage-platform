import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import type { NextRequest } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG SCREENS FLOW] Starting comprehensive debug...")

    // Step 1: Check authentication
    const user = await getCurrentUser(request)
    console.log("🔍 [DEBUG SCREENS FLOW] Current user:", user)

    // Step 2: Check all devices in database
    const allDevices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.user_id,
        d.created_at,
        d.updated_at,
        u.email as user_email
      FROM devices d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `
    console.log("🔍 [DEBUG SCREENS FLOW] All devices in database:", allDevices)

    // Step 3: Check devices for current user (if authenticated)
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
      console.log(`🔍 [DEBUG SCREENS FLOW] Devices for user ${user.id}:`, userDevices)
    }

    // Step 4: Check pairing codes
    const pairingCodes = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.device_id,
        dpc.user_id,
        dpc.screen_name,
        dpc.used_at,
        dpc.completed_at,
        dpc.created_at,
        d.name as device_name
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      ORDER BY dpc.created_at DESC
    `
    console.log("🔍 [DEBUG SCREENS FLOW] Pairing codes:", pairingCodes)

    // Step 5: Check users
    const users = await sql`
      SELECT id, email, first_name, last_name, created_at
      FROM users
      ORDER BY created_at DESC
    `
    console.log("🔍 [DEBUG SCREENS FLOW] All users:", users)

    // Step 6: Test the exact same query that the screens dashboard uses
    let dashboardQuery = null
    if (user) {
      try {
        dashboardQuery = await sql`
          SELECT 
            d.id,
            d.name,
            d.device_type,
            d.status,
            d.last_seen,
            d.user_id,
            d.created_at,
            d.updated_at
          FROM devices d
          WHERE d.user_id = ${user.id}
          ORDER BY d.created_at DESC
        `
        console.log("🔍 [DEBUG SCREENS FLOW] Dashboard query result:", dashboardQuery)
      } catch (error) {
        console.error("🔍 [DEBUG SCREENS FLOW] Dashboard query error:", error)
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        currentUser: user,
        allDevices,
        userDevices,
        pairingCodes,
        users,
        dashboardQuery,
        summary: {
          totalDevices: allDevices.length,
          devicesWithUsers: allDevices.filter((d) => d.user_id !== null).length,
          userDeviceCount: userDevices.length,
          completedPairings: pairingCodes.filter((p) => p.completed_at !== null).length,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG SCREENS FLOW] Error:", error)
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
