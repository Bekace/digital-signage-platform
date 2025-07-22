import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, pairingCode } = body

    console.log("🔍 [DEBUG] Starting device player debug analysis...")
    console.log("🔍 [DEBUG] Input:", { deviceId, pairingCode })

    const results = {
      deviceId,
      pairingCode,
      timestamp: new Date().toISOString(),
      checks: {},
      recommendations: [],
      summary: {
        status: "unknown",
        issues: [],
        working: [],
      },
    }

    // Check 1: Device existence
    if (deviceId) {
      try {
        const deviceCheck = await sql`
          SELECT id, name, device_type, status, user_id, assigned_playlist_id, created_at, last_seen
          FROM devices 
          WHERE id = ${deviceId}
        `

        results.checks.deviceExists = {
          passed: deviceCheck.length > 0,
          data: deviceCheck[0] || null,
          message: deviceCheck.length > 0 ? "Device found in database" : "Device ID does not exist in database",
        }

        if (deviceCheck.length === 0) {
          results.recommendations.push(
            "Device ID " + deviceId + " does not exist. Generate a new pairing code and register properly.",
          )
          results.summary.issues.push("Device not found in database")
        } else {
          results.summary.working.push("Device exists in database")
        }
      } catch (error) {
        results.checks.deviceExists = {
          passed: false,
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Error checking device existence",
        }
        results.summary.issues.push("Database error checking device")
      }
    }

    // Check 2: Pairing code validation
    if (pairingCode) {
      try {
        const pairingCheck = await sql`
          SELECT id, code, screen_name, device_type, user_id, expires_at, completed_at, device_id, created_at
          FROM device_pairing_codes 
          WHERE code = ${pairingCode}
        `

        if (pairingCheck.length > 0) {
          const pairing = pairingCheck[0]
          const isExpired = new Date(pairing.expires_at) < new Date()
          const isUsed = pairing.completed_at !== null

          results.checks.pairingCode = {
            passed: !isExpired && !isUsed,
            data: pairing,
            isExpired,
            isUsed,
            message: isExpired
              ? "Pairing code has expired"
              : isUsed
                ? "Pairing code has already been used"
                : "Pairing code is valid",
          }

          if (isExpired) {
            results.recommendations.push("Pairing code has expired. Generate a new one from the dashboard.")
            results.summary.issues.push("Pairing code expired")
          } else if (isUsed) {
            results.recommendations.push(
              "Pairing code already used for device ID " +
                pairing.device_id +
                ". Use that device ID or generate a new pairing code.",
            )
            results.summary.issues.push("Pairing code already used")
          } else {
            results.summary.working.push("Pairing code is valid")
          }
        } else {
          results.checks.pairingCode = {
            passed: false,
            data: null,
            message: "Pairing code not found in database",
          }
          results.recommendations.push("Pairing code not found. Generate a new pairing code from the dashboard.")
          results.summary.issues.push("Pairing code not found")
        }
      } catch (error) {
        results.checks.pairingCode = {
          passed: false,
          error: error instanceof Error ? error.message : "Unknown error",
          message: "Error checking pairing code",
        }
        results.summary.issues.push("Database error checking pairing code")
      }
    }

    // Check 3: Database content analysis
    try {
      const allDevices = await sql`
        SELECT id, name, device_type, status, user_id, assigned_playlist_id, created_at
        FROM devices 
        ORDER BY created_at DESC
        LIMIT 10
      `

      const allPairingCodes = await sql`
        SELECT id, code, screen_name, expires_at, completed_at, device_id, created_at
        FROM device_pairing_codes 
        ORDER BY created_at DESC
        LIMIT 10
      `

      results.checks.databaseContent = {
        passed: true,
        devices: allDevices,
        pairingCodes: allPairingCodes,
        message: `Found ${allDevices.length} devices and ${allPairingCodes.length} pairing codes in database`,
      }

      if (allDevices.length === 0) {
        results.recommendations.push("No devices found in database. Register a device using a valid pairing code.")
        results.summary.issues.push("No devices in database")
      }
    } catch (error) {
      results.checks.databaseContent = {
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Error fetching database content",
      }
      results.summary.issues.push("Database connection error")
    }

    // Check 4: API endpoints test
    try {
      // Test device registration endpoint
      const testRegistration = await fetch(`${request.nextUrl.origin}/api/devices/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairingCode: "TEST123" }),
      })

      results.checks.apiEndpoints = {
        passed: testRegistration.status !== 500,
        registrationStatus: testRegistration.status,
        message:
          testRegistration.status === 500 ? "Registration API returning 500 error" : "Registration API responding",
      }

      if (testRegistration.status === 500) {
        results.recommendations.push("Device registration API is returning 500 errors. Check server logs.")
        results.summary.issues.push("Registration API error")
      } else {
        results.summary.working.push("Registration API responding")
      }
    } catch (error) {
      results.checks.apiEndpoints = {
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Error testing API endpoints",
      }
      results.summary.issues.push("API endpoint error")
    }

    // Determine overall status
    if (results.summary.issues.length === 0) {
      results.summary.status = "healthy"
    } else if (results.summary.working.length > results.summary.issues.length) {
      results.summary.status = "warning"
    } else {
      results.summary.status = "error"
    }

    // Add general recommendations
    if (results.summary.issues.length > 0) {
      results.recommendations.push("To fix device player issues:")
      results.recommendations.push("1. Generate a new pairing code from dashboard screens page")
      results.recommendations.push("2. Use the pairing code to register in device player")
      results.recommendations.push("3. Verify the device appears in the screens dashboard")
      results.recommendations.push("4. Assign a playlist to the device")
    }

    console.log("🔍 [DEBUG] Analysis complete:", results.summary)

    return NextResponse.json({
      success: true,
      debug: results,
    })
  } catch (error) {
    console.error("🔍 [DEBUG] Error:", error)
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
