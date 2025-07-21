import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("🧪 [DEBUG TEST DEVICE INSERT] Starting device insert tests...")

    const testResults = {}
    const testDeviceName = `Test Device ${Date.now()}`

    // Test 1: Insert with all columns including updated_at
    try {
      console.log("🧪 Test 1: Full INSERT with updated_at")
      const test1Result = await sql`
        INSERT INTO devices (
          name,
          device_type,
          status,
          platform,
          capabilities,
          screen_resolution,
          created_at,
          last_seen,
          updated_at
        ) VALUES (
          ${testDeviceName + "_test1"},
          'web_browser',
          'online',
          'test_platform',
          '[]',
          '1920x1080',
          NOW(),
          NOW(),
          NOW()
        )
        RETURNING id, name, device_type, status, created_at, updated_at
      `

      testResults.test1_full_insert = {
        success: true,
        data: test1Result[0],
        description: "INSERT with all columns including updated_at",
      }

      // Clean up
      await sql`DELETE FROM devices WHERE id = ${test1Result[0].id}`
    } catch (error) {
      testResults.test1_full_insert = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        description: "INSERT with all columns including updated_at",
      }
    }

    // Test 2: Insert without updated_at (let it default)
    try {
      console.log("🧪 Test 2: INSERT without updated_at")
      const test2Result = await sql`
        INSERT INTO devices (
          name,
          device_type,
          status,
          platform,
          capabilities,
          screen_resolution,
          created_at,
          last_seen
        ) VALUES (
          ${testDeviceName + "_test2"},
          'web_browser',
          'online',
          'test_platform',
          '[]',
          '1920x1080',
          NOW(),
          NOW()
        )
        RETURNING id, name, device_type, status, created_at, updated_at
      `

      testResults.test2_no_updated_at = {
        success: true,
        data: test2Result[0],
        description: "INSERT without updated_at column",
      }

      // Clean up
      await sql`DELETE FROM devices WHERE id = ${test2Result[0].id}`
    } catch (error) {
      testResults.test2_no_updated_at = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        description: "INSERT without updated_at column",
      }
    }

    // Test 3: Minimal insert (only required fields)
    try {
      console.log("🧪 Test 3: Minimal INSERT")
      const test3Result = await sql`
        INSERT INTO devices (name, device_type)
        VALUES (${testDeviceName + "_test3"}, 'web_browser')
        RETURNING id, name, device_type, status, created_at, updated_at
      `

      testResults.test3_minimal = {
        success: true,
        data: test3Result[0],
        description: "Minimal INSERT with only required fields",
      }

      // Clean up
      await sql`DELETE FROM devices WHERE id = ${test3Result[0].id}`
    } catch (error) {
      testResults.test3_minimal = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        description: "Minimal INSERT with only required fields",
      }
    }

    // Test 4: Insert with user_id (simulate real scenario)
    try {
      console.log("🧪 Test 4: INSERT with user_id")
      const test4Result = await sql`
        INSERT INTO devices (
          name,
          device_type,
          status,
          platform,
          capabilities,
          screen_resolution,
          user_id,
          created_at,
          last_seen
        ) VALUES (
          ${testDeviceName + "_test4"},
          'web_browser',
          'online',
          'test_platform',
          '[]',
          '1920x1080',
          1,
          NOW(),
          NOW()
        )
        RETURNING id, name, device_type, status, user_id, created_at, updated_at
      `

      testResults.test4_with_user = {
        success: true,
        data: test4Result[0],
        description: "INSERT with user_id included",
      }

      // Clean up
      await sql`DELETE FROM devices WHERE id = ${test4Result[0].id}`
    } catch (error) {
      testResults.test4_with_user = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        description: "INSERT with user_id included",
      }
    }

    // Test 5: Exact replication of registration API call
    try {
      console.log("🧪 Test 5: Exact API replication")
      const test5Result = await sql`
        INSERT INTO devices (
          name,
          device_type,
          status,
          platform,
          capabilities,
          screen_resolution,
          created_at,
          last_seen,
          updated_at
        ) VALUES (
          ${"Device Player test"},
          'web_browser',
          'online',
          'Win32',
          ${JSON.stringify(["video", "image", "audio", "web", "slides", "pdf", "office", "text"])},
          '1920x1080',
          NOW(),
          NOW(),
          NOW()
        )
        RETURNING id, name, device_type, status, created_at
      `

      testResults.test5_api_replication = {
        success: true,
        data: test5Result[0],
        description: "Exact replication of registration API call",
      }

      // Clean up
      await sql`DELETE FROM devices WHERE id = ${test5Result[0].id}`
    } catch (error) {
      testResults.test5_api_replication = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        description: "Exact replication of registration API call",
      }
    }

    // Analyze results
    const successfulTests = Object.values(testResults).filter((test: any) => test.success).length
    const failedTests = Object.values(testResults).filter((test: any) => !test.success).length

    let recommendation = "Unable to determine issue"

    if (successfulTests === 0) {
      recommendation = "All INSERT tests failed - there may be a fundamental database issue or permission problem"
    } else if (testResults.test2_no_updated_at?.success && !testResults.test1_full_insert?.success) {
      recommendation = "Remove updated_at from INSERT statement - let the database handle it with default values"
    } else if (testResults.test4_with_user?.success && !testResults.test3_minimal?.success) {
      recommendation = "user_id may be required for device creation - ensure pairing codes have valid user_id"
    } else if (successfulTests > 0) {
      recommendation = "Some INSERT methods work - use the successful approach in the registration API"
    }

    console.log("🧪 [DEBUG TEST DEVICE INSERT] Tests complete:", {
      successful: successfulTests,
      failed: failedTests,
      recommendation,
    })

    return NextResponse.json({
      success: true,
      data: {
        tests: testResults,
        summary: {
          total: Object.keys(testResults).length,
          successful: successfulTests,
          failed: failedTests,
        },
        analysis: {
          recommendation,
          allTestsPassed: failedTests === 0,
          someTestsPassed: successfulTests > 0,
          noTestsPassed: successfulTests === 0,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG TEST DEVICE INSERT] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run device insert tests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
