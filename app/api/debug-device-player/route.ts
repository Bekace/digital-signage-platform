import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

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

    const results: any = {
      timestamp: new Date().toISOString(),
      deviceId,
      pairingCode,
      tests: {},
      summary: {
        issues: [],
        recommendations: [],
      },
    }

    // Test 1: Check if device exists in database
    if (deviceId) {
      try {
        const deviceCheck = await sql`
          SELECT 
            id,
            name,
            device_type,
            status,
            user_id,
            assigned_playlist_id,
            playlist_status,
            platform,
            screen_resolution,
            last_seen,
            created_at,
            updated_at
          FROM devices 
          WHERE id = ${deviceId}
        `

        results.tests.deviceExists = {
          status: deviceCheck.length > 0 ? "PASS" : "FAIL",
          data: deviceCheck[0] || null,
          message:
            deviceCheck.length > 0
              ? `Device ${deviceId} found in database`
              : `Device ${deviceId} NOT found in database`,
        }

        if (deviceCheck.length === 0) {
          results.summary.issues.push(`Device ID ${deviceId} does not exist in the devices table`)
          results.summary.recommendations.push(
            "The device needs to be properly registered through a valid pairing code",
          )
        }
      } catch (error) {
        results.tests.deviceExists = {
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Failed to check device existence",
        }
      }
    }

    // Test 2: Check pairing code validity
    if (pairingCode) {
      try {
        const pairingCheck = await sql`
          SELECT 
            id,
            code,
            screen_name,
            device_type,
            user_id,
            expires_at,
            device_id,
            used_at,
            created_at
          FROM device_pairing_codes 
          WHERE code = ${pairingCode}
          ORDER BY created_at DESC
          LIMIT 1
        `

        const isValid = pairingCheck.length > 0
        const isExpired = isValid && new Date(pairingCheck[0].expires_at) < new Date()
        const isUsed = isValid && pairingCheck[0].device_id !== null

        results.tests.pairingCode = {
          status: isValid && !isExpired && !isUsed ? "PASS" : "FAIL",
          data: pairingCheck[0] || null,
          message: !isValid
            ? `Pairing code ${pairingCode} not found`
            : isExpired
              ? `Pairing code ${pairingCode} has expired`
              : isUsed
                ? `Pairing code ${pairingCode} already used for device ${pairingCheck[0].device_id}`
                : `Pairing code ${pairingCode} is valid and available`,
        }

        if (!isValid) {
          results.summary.issues.push(`Pairing code ${pairingCode} does not exist`)
          results.summary.recommendations.push("Generate a new pairing code from the dashboard")
        } else if (isExpired) {
          results.summary.issues.push(`Pairing code ${pairingCode} has expired`)
          results.summary.recommendations.push("Generate a new pairing code - codes expire after a certain time")
        } else if (isUsed) {
          results.summary.issues.push(`Pairing code ${pairingCode} is already used`)
          results.summary.recommendations.push("This code was already used to register a device - generate a new one")
        }
      } catch (error) {
        results.tests.pairingCode = {
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Failed to check pairing code",
        }
      }
    }

    // Test 3: Check all devices in database
    try {
      const allDevices = await sql`
        SELECT 
          id,
          name,
          device_type,
          status,
          user_id,
          assigned_playlist_id,
          created_at
        FROM devices 
        ORDER BY created_at DESC
        LIMIT 10
      `

      results.tests.allDevices = {
        status: "INFO",
        data: allDevices,
        message: `Found ${allDevices.length} devices in database`,
      }
    } catch (error) {
      results.tests.allDevices = {
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch devices",
      }
    }

    // Test 4: Check all pairing codes
    try {
      const allPairingCodes = await sql`
        SELECT 
          id,
          code,
          screen_name,
          device_type,
          user_id,
          expires_at,
          device_id,
          used_at,
          created_at
        FROM device_pairing_codes 
        ORDER BY created_at DESC
        LIMIT 10
      `

      results.tests.allPairingCodes = {
        status: "INFO",
        data: allPairingCodes,
        message: `Found ${allPairingCodes.length} pairing codes in database`,
      }
    } catch (error) {
      results.tests.allPairingCodes = {
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch pairing codes",
      }
    }

    // Test 5: Test device registration API
    if (pairingCode && action === "test_registration") {
      try {
        const registrationTest = await fetch(`${request.nextUrl.origin}/api/devices/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceCode: pairingCode,
            name: `Debug Test Device ${Date.now()}`,
            deviceType: "web_browser",
            platform: "debug",
            userAgent: "Debug Test",
            screenResolution: "1920x1080",
            capabilities: ["debug"],
          }),
        })

        const registrationResult = await registrationTest.json()

        results.tests.registrationAPI = {
          status: registrationResult.success ? "PASS" : "FAIL",
          data: registrationResult,
          message: registrationResult.success
            ? "Device registration API working correctly"
            : `Registration failed: ${registrationResult.error}`,
        }

        if (!registrationResult.success) {
          results.summary.issues.push(`Device registration API failed: ${registrationResult.error}`)
        }
      } catch (error) {
        results.tests.registrationAPI = {
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Failed to test registration API",
        }
      }
    }

    // Test 6: Test playlist API if device exists
    if (deviceId && results.tests.deviceExists?.status === "PASS") {
      try {
        const playlistTest = await fetch(`${request.nextUrl.origin}/api/devices/${deviceId}/playlist`)
        const playlistResult = await playlistTest.json()

        results.tests.playlistAPI = {
          status: playlistTest.ok ? "PASS" : "FAIL",
          data: playlistResult,
          message: playlistTest.ok
            ? "Playlist API working correctly"
            : `Playlist API failed: ${playlistResult.error || "Unknown error"}`,
        }
      } catch (error) {
        results.tests.playlistAPI = {
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Failed to test playlist API",
        }
      }
    }

    // Generate summary
    const failedTests = Object.values(results.tests).filter((test: any) => test.status === "FAIL").length
    const errorTests = Object.values(results.tests).filter((test: any) => test.status === "ERROR").length

    results.summary.status = failedTests === 0 && errorTests === 0 ? "HEALTHY" : "ISSUES_FOUND"
    results.summary.totalTests = Object.keys(results.tests).length
    results.summary.failedTests = failedTests
    results.summary.errorTests = errorTests

    // Add general recommendations
    if (results.summary.issues.length === 0) {
      results.summary.recommendations.push("All tests passed - the device player should be working correctly")
    } else {
      results.summary.recommendations.push("Fix the identified issues to resolve device player problems")
    }

    return NextResponse.json({
      success: true,
      debug: results,
    })
  } catch (error) {
    console.error("🔍 [DEBUG DEVICE PLAYER] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
