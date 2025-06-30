import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Starting debug screens flow...")

    // Test authentication
    console.log("🔍 [DEBUG] Testing authentication...")
    const user = await getCurrentUser(request)

    // Get all devices (regardless of user)
    console.log("🔍 [DEBUG] Fetching all devices...")
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

    // Get user devices if authenticated
    let userDevices = []
    if (user) {
      console.log(`🔍 [DEBUG] Fetching devices for user ${user.id}...`)
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

    // Get pairing codes
    console.log("🔍 [DEBUG] Fetching pairing codes...")
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

    // Get all users
    console.log("🔍 [DEBUG] Fetching users...")
    const users = await sql`
      SELECT id, email, first_name, last_name, created_at
      FROM users
      ORDER BY created_at DESC
    `

    // Test the exact same query that the dashboard uses
    let dashboardQuery = []
    if (user) {
      console.log(`🔍 [DEBUG] Testing dashboard query for user ${user.id}...`)
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
    }

    const response = {
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
          completedPairings: pairingCodes.filter((pc) => pc.completed_at !== null).length,
        },
      },
    }

    console.log("🔍 [DEBUG] Debug response prepared")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [DEBUG] Error:", error)
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
