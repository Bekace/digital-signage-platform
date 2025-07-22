import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId")
    const pairingCode = searchParams.get("pairingCode")

    console.log("🔍 [DEBUG DEVICE PLAYER] Starting comprehensive debug", { deviceId, pairingCode })

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      deviceId,
      pairingCode,
      checks: {},
    }

    // 1. Check if devices table exists and get structure
    try {
      const deviceTableInfo = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'devices' 
        ORDER BY ordinal_position
      `
      debugInfo.checks.deviceTableStructure = {
        success: true,
        columns: deviceTableInfo,
      }
    } catch (error) {
      debugInfo.checks.deviceTableStructure = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // 2. Check if device exists (if deviceId provided)
    if (deviceId) {
      try {
        const deviceCheck = await sql`
          SELECT * FROM devices WHERE id = ${deviceId}
        `
        debugInfo.checks.deviceExists = {
          success: true,
          found: deviceCheck.length > 0,
          data: deviceCheck[0] || null,
        }
      } catch (error) {
        debugInfo.checks.deviceExists = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // 3. Check pairing codes table
    try {
      const pairingTableInfo = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'device_pairing_codes' 
        ORDER BY ordinal_position
      `
      debugInfo.checks.pairingTableStructure = {
        success: true,
        columns: pairingTableInfo,
      }

      // Get all pairing codes
      const allPairingCodes = await sql`
        SELECT * FROM device_pairing_codes 
        ORDER BY created_at DESC 
        LIMIT 10
      `
      debugInfo.checks.pairingCodes = {
        success: true,
        total: allPairingCodes.length,
        recent: allPairingCodes,
      }

      // Check specific pairing code if provided
      if (pairingCode) {
        const specificCode = await sql`
          SELECT * FROM device_pairing_codes 
          WHERE code = ${pairingCode.toUpperCase()}
        `
        debugInfo.checks.specificPairingCode = {
          success: true,
          found: specificCode.length > 0,
          data: specificCode[0] || null,
        }
      }
    } catch (error) {
      debugInfo.checks.pairingCodes = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // 4. Check playlists table and assignments
    try {
      const playlistTableInfo = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'playlists' 
        ORDER BY ordinal_position
      `
      debugInfo.checks.playlistTableStructure = {
        success: true,
        columns: playlistTableInfo,
      }

      // Get devices with playlist assignments
      const devicesWithPlaylists = await sql`
        SELECT d.id, d.name, d.assigned_playlist_id, p.name as playlist_name
        FROM devices d
        LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
        WHERE d.assigned_playlist_id IS NOT NULL
        LIMIT 10
      `
      debugInfo.checks.playlistAssignments = {
        success: true,
        assignments: devicesWithPlaylists,
      }
    } catch (error) {
      debugInfo.checks.playlists = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // 5. Check heartbeats table
    try {
      const heartbeatTableInfo = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'device_heartbeats' 
        ORDER BY ordinal_position
      `
      debugInfo.checks.heartbeatTableStructure = {
        success: true,
        columns: heartbeatTableInfo,
      }

      // Get recent heartbeats
      const recentHeartbeats = await sql`
        SELECT * FROM device_heartbeats 
        ORDER BY created_at DESC 
        LIMIT 10
      `
      debugInfo.checks.recentHeartbeats = {
        success: true,
        heartbeats: recentHeartbeats,
      }

      // Check heartbeats for specific device
      if (deviceId) {
        const deviceHeartbeats = await sql`
          SELECT * FROM device_heartbeats 
          WHERE device_id = ${deviceId}
          ORDER BY created_at DESC 
          LIMIT 5
        `
        debugInfo.checks.deviceHeartbeats = {
          success: true,
          heartbeats: deviceHeartbeats,
        }
      }
    } catch (error) {
      debugInfo.checks.heartbeats = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // 6. Test device registration flow
    if (pairingCode) {
      try {
        // Check if pairing code is valid and unused
        const validPairingCode = await sql`
          SELECT * FROM device_pairing_codes 
          WHERE code = ${pairingCode.toUpperCase()} 
          AND used_at IS NULL 
          AND expires_at > NOW()
        `

        debugInfo.checks.pairingCodeValidation = {
          success: true,
          isValid: validPairingCode.length > 0,
          codeData: validPairingCode[0] || null,
        }
      } catch (error) {
        debugInfo.checks.pairingCodeValidation = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // 7. Check for common issues
    const commonIssues = []

    // Check if device exists but has no playlist
    if (
      deviceId &&
      debugInfo.checks.deviceExists?.found &&
      !debugInfo.checks.deviceExists?.data?.assigned_playlist_id
    ) {
      commonIssues.push("Device exists but has no playlist assigned")
    }

    // Check if pairing code is expired or used
    if (pairingCode && debugInfo.checks.specificPairingCode?.found) {
      const codeData = debugInfo.checks.specificPairingCode.data
      if (codeData.used_at) {
        commonIssues.push("Pairing code has already been used")
      }
      if (new Date(codeData.expires_at) < new Date()) {
        commonIssues.push("Pairing code has expired")
      }
    }

    debugInfo.commonIssues = commonIssues

    console.log("🔍 [DEBUG DEVICE PLAYER] Debug complete", debugInfo)

    return NextResponse.json({
      success: true,
      debugInfo,
    })
  } catch (error) {
    console.error("🔍 [DEBUG DEVICE PLAYER] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, deviceId, pairingCode } = body

    console.log("🔍 [DEBUG DEVICE PLAYER] POST action:", action, { deviceId, pairingCode })

    switch (action) {
      case "generatePairingCode":
        // Generate a new pairing code for testing
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        const insertResult = await sql`
          INSERT INTO device_pairing_codes (code, expires_at, created_by)
          VALUES (${newCode}, ${expiresAt.toISOString()}, 'debug-system')
          RETURNING *
        `

        return NextResponse.json({
          success: true,
          pairingCode: insertResult[0],
        })

      case "assignTestPlaylist":
        if (!deviceId) {
          return NextResponse.json(
            {
              success: false,
              error: "Device ID required",
            },
            { status: 400 },
          )
        }

        // Find a test playlist or create one
        let testPlaylist = await sql`
          SELECT * FROM playlists WHERE name LIKE '%test%' OR name LIKE '%debug%' LIMIT 1
        `

        if (testPlaylist.length === 0) {
          // Create a test playlist
          testPlaylist = await sql`
            INSERT INTO playlists (name, description, status, loop_enabled, created_by)
            VALUES ('Debug Test Playlist', 'Auto-generated for debugging', 'active', true, 'debug-system')
            RETURNING *
          `
        }

        // Assign playlist to device
        await sql`
          UPDATE devices 
          SET assigned_playlist_id = ${testPlaylist[0].id}
          WHERE id = ${deviceId}
        `

        return NextResponse.json({
          success: true,
          playlist: testPlaylist[0],
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unknown action",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("🔍 [DEBUG DEVICE PLAYER] POST Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
