import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("📺 [CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📺 [CREATE SCREEN] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("📺 [CREATE SCREEN] Request data:", { pairingCode })

    if (!pairingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code is required",
        },
        { status: 400 },
      )
    }

    // Find the pairing code record
    const pairingCodeRecord = await sql`
      SELECT 
        id,
        code,
        screen_name,
        device_type,
        expires_at,
        completed_at,
        user_id
      FROM device_pairing_codes 
      WHERE code = ${pairingCode} 
      AND user_id = ${user.id}
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (pairingCodeRecord.length === 0) {
      console.log("📺 [CREATE SCREEN] Invalid or expired pairing code")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired pairing code",
        },
        { status: 400 },
      )
    }

    const record = pairingCodeRecord[0]

    // Check if already used
    if (record.completed_at) {
      console.log("📺 [CREATE SCREEN] Pairing code already used")
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code has already been used",
        },
        { status: 400 },
      )
    }

    // Create the device
    const deviceResult = await sql`
      INSERT INTO devices (
        user_id, 
        name, 
        device_type, 
        status,
        playlist_status,
        created_at,
        updated_at
      ) VALUES (
        ${user.id}, 
        ${record.screen_name}, 
        ${record.device_type}, 
        'offline',
        'none',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, name, device_type, status, playlist_status, created_at, updated_at
    `

    const newDevice = deviceResult[0]
    console.log("📺 [CREATE SCREEN] Device created:", newDevice.id)

    // Mark pairing code as completed
    await sql`
      UPDATE device_pairing_codes 
      SET completed_at = CURRENT_TIMESTAMP
      WHERE id = ${record.id}
    `

    console.log("📺 [CREATE SCREEN] Pairing code marked as completed")

    return NextResponse.json({
      success: true,
      device: {
        id: newDevice.id,
        name: newDevice.name,
        deviceType: newDevice.device_type,
        status: newDevice.status,
        playlistStatus: newDevice.playlist_status,
        createdAt: newDevice.created_at,
        updatedAt: newDevice.updated_at,
      },
      message: "Screen created successfully",
    })
  } catch (error) {
    console.error("📺 [CREATE SCREEN] Error:", error)
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
