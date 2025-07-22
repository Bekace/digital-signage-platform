import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { deviceId, pairingCode, action } = body

    console.log("🔍 [DEBUG DEVICE PLAYER] Request:", { deviceId, pairingCode, action, userId: user.id })

    const debug: any = {
      timestamp: new Date().toISOString(),
      deviceId,
      pairingCode,
      tests: {},
      summary: {
        status: "HEALTHY",
        totalTests: 0,
        failedTests: 0,
        errorTests: 0,
        issues: [],
        recommendations: [],
      },
    }

    // Test 1: Check if device exists in database
    if (deviceId) {
      try {
        const deviceCheck = await sql`
          SELECT id, name, device_type, status, user_id, assigned_playlist_id, created_at, last_seen
          FROM devices 
          WHERE id = ${Number.parseInt(deviceId)} AND user_id = ${user.id}
        `

        debug.tests.deviceExists = {
          status: deviceCheck.length > 0 ? "PASS" : "FAIL",
          message:
            deviceCheck.length > 0
              ? `Device ${deviceId} exists in database`
              : `Device ${deviceId} does not exist in database`,
          data: deviceCheck[0] || null,
        }

        if (deviceCheck.length === 0) {
          debug.summary.issues.push(`Device ID ${deviceId} not found in database`)
          debug.summary.recommendations.push("Use a valid pairing code to register a new device")
        }
      } catch (error) {
        debug.tests.deviceExists = {
          status: "ERROR",
          message: "Failed to check device existence",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Test 2: Check pairing code validity
    if (pairingCode) {
      try {
        const pairingCheck = await sql`
          SELECT id, code, screen_name, device_type, user_id, expires_at, device_id, used_at, created_at
          FROM device_pairing_codes 
          WHERE code = ${pairingCode.toUpperCase()} AND user_id = ${user.id}
          ORDER BY created_at DESC
          LIMIT 1
        `

        if (pairingCheck.length > 0) {
          const pairing = pairingCheck[0]
          const isExpired = new Date(pairing.expires_at) < new Date()
          const isUsed = !!pairing.used_at

          let status = "PASS"
          let message = "Pairing code is valid and available"

          if (isExpired) {
            status = "FAIL"
            message = "Pairing code has expired"
            debug.summary.issues.push("Pairing code has expired")
            debug.summary.recommendations.push("Generate a new pairing code from the dashboard")
          } else if (isUsed) {
            status = "INFO"
            message = `Pairing code already used for device ${pairing.device_id}`
          }

          debug.tests.pairingCodeValid = {
            status,
            message,
            data: pairing,
          }
        } else {
          debug.tests.pairingCodeValid = {
            status: "FAIL",
            message: "Pairing code not found or doesn't belong to current user",
            data: null,
          }
          debug.summary.issues.push("Invalid pairing code")
          debug.summary.recommendations.push("Generate a new pairing code from the dashboard")
        }
      } catch (error) {
        debug.tests.pairingCodeValid = {
          status: "ERROR",
          message: "Failed to check pairing code",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Test 3: Check all devices for current user
    try {
      const allDevices = await sql`
        SELECT id, name, device_type, status, assigned_playlist_id, last_seen, created_at
        FROM devices 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `

      debug.tests.userDevices = {
        status: "INFO",
        message: `Found ${allDevices.length} devices for current user`,
        data: allDevices,
      }
    } catch (error) {
      debug.tests.userDevices = {
        status: "ERROR",
        message: "Failed to fetch user devices",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 4: Check all pairing codes for current user
    try {
      const allPairingCodes = await sql`
        SELECT id, code, screen_name, device_type, expires_at, device_id, used_at, created_at
        FROM device_pairing_codes 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 10
      `

      debug.tests.userPairingCodes = {
        status: "INFO",
        message: `Found ${allPairingCodes.length} pairing codes for current user`,
        data: allPairingCodes,
      }
    } catch (error) {
      debug.tests.userPairingCodes = {
        status: "ERROR",
        message: "Failed to fetch pairing codes",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 5: Test device registration if requested
    if (action === "test_registration" && pairingCode) {
      try {
        const registrationResponse = await fetch(`${request.nextUrl.origin}/api/devices/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            deviceCode: pairingCode.toUpperCase(),
            name: `Debug Test Device ${Date.now()}`,
            deviceType: "web_browser",
            platform: "Debug",
            userAgent: "Debug Agent",
            screenResolution: "1920x1080",
            capabilities: ["video", "image", "audio", "web"],
          }),
        })

        const registrationData = await registrationResponse.json()

        debug.tests.registrationTest = {
          status: registrationData.success ? "PASS" : "FAIL",
          message: registrationData.success
            ? "Device registration successful"
            : `Registration failed: ${registrationData.error}`,
          data: registrationData,
        }

        if (!registrationData.success) {
          debug.summary.issues.push(`Registration failed: ${registrationData.error}`)
        }
      } catch (error) {
        debug.tests.registrationTest = {
          status: "ERROR",
          message: "Failed to test registration",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Calculate summary
    debug.summary.totalTests = Object.keys(debug.tests).length
    debug.summary.failedTests = Object.values(debug.tests).filter((test: any) => test.status === "FAIL").length
    debug.summary.errorTests = Object.values(debug.tests).filter((test: any) => test.status === "ERROR").length

    if (debug.summary.failedTests > 0 || debug.summary.errorTests > 0) {
      debug.summary.status = "ISSUES_FOUND"
    }

    // Add general recommendations
    if (debug.summary.issues.length === 0) {
      debug.summary.recommendations.push("System appears to be working correctly")
    }

    console.log("🔍 [DEBUG DEVICE PLAYER] Results:", debug.summary)

    return NextResponse.json({
      success: true,
      debug,
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
