import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("✅ [COMPLETE REPAIR] Starting repair completion...")

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { deviceId } = params
    const body = await request.json()
    const { pairingCode } = body

    console.log("✅ [COMPLETE REPAIR] Request:", { deviceId, pairingCode, userId: user.id })

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Find the pairing code and verify it belongs to this device and user
    const pairingResult = await sql`
      SELECT 
        pc.id as pairing_id,
        pc.code,
        pc.screen_name,
        pc.device_type,
        pc.user_id,
        pc.device_id,
        pc.used_at,
        pc.completed_at
      FROM device_pairing_codes pc
      WHERE pc.code = ${pairingCode}
      AND pc.device_id = ${deviceId}
      AND pc.user_id = ${user.id}
      AND pc.expires_at > NOW()
      ORDER BY pc.created_at DESC
      LIMIT 1
    `

    if (pairingResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid pairing code or not authorized for this device" },
        { status: 400 },
      )
    }

    const pairing = pairingResult[0]

    // Check if device exists and belongs to user
    const deviceCheck = await sql`
      SELECT id, name, device_type, status
      FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    if (deviceCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    // Update the device status to indicate successful re-pairing
    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        status = 'online',
        last_seen = NOW(),
        updated_at = NOW()
      WHERE id = ${deviceId} AND user_id = ${user.id}
      RETURNING id, name, device_type, status, updated_at
    `

    if (updatedDevice.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to update device" }, { status: 500 })
    }

    // Mark pairing as completed
    await sql`
      UPDATE device_pairing_codes 
      SET 
        completed_at = NOW(),
        used_at = NOW()
      WHERE id = ${pairing.pairing_id}
    `

    const device = updatedDevice[0]

    console.log("✅ [COMPLETE REPAIR] Device re-paired successfully:", {
      deviceId: device.id,
      deviceName: device.name,
      status: device.status,
    })

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        status: device.status,
        updatedAt: device.updated_at,
      },
      message: "Device re-paired successfully",
    })
  } catch (error) {
    console.error("✅ [COMPLETE REPAIR] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete device re-pairing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
