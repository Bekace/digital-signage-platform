import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🖥️ [CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🖥️ [CREATE SCREEN] No authenticated user")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("🖥️ [CREATE SCREEN] Request:", { pairingCode, userId: user.id })

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Test database connection
    try {
      await sql`SELECT 1`
      console.log("🖥️ [CREATE SCREEN] Database connection successful")
    } catch (dbError) {
      console.error("🖥️ [CREATE SCREEN] Database connection failed:", dbError)
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 })
    }

    // Find the pairing code and associated device
    const pairingResult = await sql`
      SELECT 
        pc.id as pairing_id,
        pc.code,
        pc.screen_name,
        pc.device_type,
        pc.user_id,
        pc.device_id,
        pc.used_at,
        pc.completed_at,
        d.id as device_id,
        d.name as device_name,
        d.device_type as device_device_type,
        d.status as device_status
      FROM device_pairing_codes pc
      LEFT JOIN devices d ON pc.device_id = d.id
      WHERE pc.code = ${pairingCode}
      AND pc.user_id = ${user.id}
      AND pc.expires_at > NOW()
      ORDER BY pc.created_at DESC
      LIMIT 1
    `

    console.log("🖥️ [CREATE SCREEN] Pairing lookup result:", pairingResult)

    if (pairingResult.length === 0) {
      console.log("🖥️ [CREATE SCREEN] No valid pairing code found for user")
      return NextResponse.json({ success: false, error: "Invalid pairing code or not authorized" }, { status: 400 })
    }

    const pairing = pairingResult[0]

    if (!pairing.device_id) {
      console.log("🖥️ [CREATE SCREEN] Device not connected yet")
      return NextResponse.json(
        { success: false, error: "Device not connected yet. Please connect the device first." },
        { status: 400 },
      )
    }

    // Update the device to assign it to the user and mark as active
    console.log("🖥️ [CREATE SCREEN] Updating device:", pairing.device_id)

    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        user_id = ${user.id},
        status = 'online',
        last_seen = NOW()
      WHERE id = ${pairing.device_id}
      RETURNING id, name, device_type, status, user_id, created_at, last_seen
    `

    console.log("🖥️ [CREATE SCREEN] Device update result:", updatedDevice)

    if (updatedDevice.length === 0) {
      console.log("🖥️ [CREATE SCREEN] Failed to update device")
      return NextResponse.json({ success: false, error: "Failed to update device" }, { status: 500 })
    }

    // Mark pairing as completed
    const completedPairing = await sql`
      UPDATE device_pairing_codes 
      SET completed_at = NOW()
      WHERE id = ${pairing.pairing_id}
      RETURNING id, completed_at
    `

    console.log("🖥️ [CREATE SCREEN] Pairing completion result:", completedPairing)

    const screen = updatedDevice[0]

    // Verify the screen was created by querying back
    const verification = await sql`
      SELECT * FROM devices WHERE id = ${screen.id} AND user_id = ${user.id}
    `
    console.log("🖥️ [CREATE SCREEN] Screen verification:", verification)

    console.log("🖥️ [CREATE SCREEN] Screen created successfully:", {
      screenId: screen.id,
      screenName: screen.name,
      deviceType: screen.device_type,
      status: screen.status,
      userId: screen.user_id,
    })

    return NextResponse.json({
      success: true,
      screen: {
        id: screen.id,
        name: screen.name,
        deviceType: screen.device_type,
        status: screen.status,
        userId: screen.user_id,
        createdAt: screen.created_at,
        lastSeen: screen.last_seen,
      },
      message: "Screen created successfully",
      debug: {
        screenId: screen.id,
        pairingId: pairing.pairing_id,
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("🖥️ [CREATE SCREEN] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create screen",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
