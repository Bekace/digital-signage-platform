import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    console.log("[CHECK CONNECTION] Checking code:", code)

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 })
    }

    // Check if pairing code exists and get its details
    const codeResult = await sql`
      SELECT 
        dpc.id,
        dpc.code,
        dpc.screen_name,
        dpc.device_type,
        dpc.user_id,
        dpc.expires_at,
        dpc.used_at,
        dpc.device_id,
        dpc.completed_at,
        d.id as linked_device_id,
        d.name as device_name,
        d.status as device_status,
        d.last_seen
      FROM device_pairing_codes dpc
      LEFT JOIN devices d ON dpc.device_id = d.id
      WHERE dpc.code = ${code}
      AND dpc.expires_at > CURRENT_TIMESTAMP
    `

    console.log("[CHECK CONNECTION] Code lookup result:", codeResult)

    if (codeResult.length === 0) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: "Invalid or expired pairing code",
      })
    }

    const pairingRecord = codeResult[0]

    // If device is already linked and completed
    if (pairingRecord.device_id && pairingRecord.completed_at) {
      console.log("[CHECK CONNECTION] Device already connected:", pairingRecord.device_id)
      return NextResponse.json({
        success: true,
        connected: true,
        device: {
          id: pairingRecord.linked_device_id,
          name: pairingRecord.device_name,
          status: pairingRecord.device_status,
          lastSeen: pairingRecord.last_seen,
        },
        message: "Device is connected",
      })
    }

    // Look for recently created devices that might match this pairing code
    // Check for devices created in the last 5 minutes with matching name or type
    const recentDevices = await sql`
      SELECT id, name, device_type, status, last_seen, created_at
      FROM devices 
      WHERE user_id = ${pairingRecord.user_id}
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
      AND (
        name ILIKE ${`%${pairingRecord.screen_name}%`} OR
        device_type = ${pairingRecord.device_type} OR
        name ILIKE ${`%${pairingRecord.code}%`}
      )
      ORDER BY created_at DESC
      LIMIT 1
    `

    console.log("[CHECK CONNECTION] Recent devices found:", recentDevices)

    if (recentDevices.length > 0) {
      const matchedDevice = recentDevices[0]

      // Link this device to the pairing code
      await sql`
        UPDATE device_pairing_codes 
        SET 
          device_id = ${matchedDevice.id},
          used_at = CURRENT_TIMESTAMP,
          completed_at = CURRENT_TIMESTAMP
        WHERE code = ${code}
      `

      console.log("[CHECK CONNECTION] Linked device to pairing code:", matchedDevice.id)

      return NextResponse.json({
        success: true,
        connected: true,
        device: {
          id: matchedDevice.id,
          name: matchedDevice.name,
          status: matchedDevice.status,
          lastSeen: matchedDevice.last_seen,
        },
        message: "Device connected successfully",
      })
    }

    // No device connected yet
    console.log("[CHECK CONNECTION] No device connected yet")
    return NextResponse.json({
      success: true,
      connected: false,
      message: "Waiting for device connection",
      expiresAt: pairingRecord.expires_at,
    })
  } catch (error) {
    console.error("[CHECK CONNECTION] Error:", error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: "Failed to check connection",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
