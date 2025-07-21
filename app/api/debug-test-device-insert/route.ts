import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("🔍 [DEBUG TEST INSERT] Starting device insert tests...")

    const results = {
      test1: null as any,
      test2: null as any,
      test3: null as any,
      test4: null as any,
    }

    // Test 1: Try the exact same INSERT as the failing registration
    try {
      console.log("🔍 [DEBUG TEST INSERT] Test 1: Exact registration INSERT")
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
          'Debug Test Device 1',
          'web_browser',
          'online',
          'debug',
          '["test"]',
          '1920x1080',
          NOW(),
          NOW(),
          NOW()
        )
        RETURNING id, name, device_type, status, created_at, updated_at
      `
      results.test1 = { success: true, data: test1Result[0] }

      // Clean up test device
      await sql`DELETE FROM devices WHERE name = 'Debug Test Device 1'`
    } catch (error) {
      results.test1 = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 2: INSERT without updated_at (let it default)
    try {
      console.log("🔍 [DEBUG TEST INSERT] Test 2: INSERT without updated_at")
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
          'Debug Test Device 2',
          'web_browser',
          'online',
          'debug',
          '["test"]',
          '1920x1080',
          NOW(),
          NOW()
        )
        RETURNING id, name, device_type, status, created_at, updated_at
      `
      results.test2 = { success: true, data: test2Result[0] }

      // Clean up test device
      await sql`DELETE FROM devices WHERE name = 'Debug Test Device 2'`
    } catch (error) {
      results.test2 = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 3: Minimal INSERT with only required fields
    try {
      console.log("🔍 [DEBUG TEST INSERT] Test 3: Minimal INSERT")
      const test3Result = await sql`
        INSERT INTO devices (name, device_type) 
        VALUES ('Debug Test Device 3', 'web_browser')
        RETURNING id, name, device_type, status, created_at, updated_at
      `
      results.test3 = { success: true, data: test3Result[0] }

      // Clean up test device
      await sql`DELETE FROM devices WHERE name = 'Debug Test Device 3'`
    } catch (error) {
      results.test3 = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test 4: Check if we can UPDATE the updated_at field
    try {
      console.log("🔍 [DEBUG TEST INSERT] Test 4: UPDATE test")
      // First create a device without updated_at
      const insertResult = await sql`
        INSERT INTO devices (name, device_type) 
        VALUES ('Debug Test Device 4', 'web_browser')
        RETURNING id
      `

      const deviceId = insertResult[0].id

      // Then try to update it
      const updateResult = await sql`
        UPDATE devices 
        SET updated_at = NOW(), status = 'online'
        WHERE id = ${deviceId}
        RETURNING id, name, updated_at, status
      `

      results.test4 = { success: true, data: updateResult[0] }

      // Clean up test device
      await sql`DELETE FROM devices WHERE id = ${deviceId}`
    } catch (error) {
      results.test4 = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    console.log("🔍 [DEBUG TEST INSERT] All tests completed")

    return NextResponse.json({
      success: true,
      data: {
        tests: results,
        analysis: {
          exactInsertWorks: results.test1?.success || false,
          insertWithoutUpdatedAtWorks: results.test2?.success || false,
          minimalInsertWorks: results.test3?.success || false,
          updateWorks: results.test4?.success || false,
          recommendation: getRecommendation(results),
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG TEST INSERT] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run insert tests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getRecommendation(results: any): string {
  if (results.test1?.success) {
    return "The exact INSERT works fine. The issue might be elsewhere in the registration flow."
  }

  if (results.test2?.success && !results.test1?.success) {
    return "Remove updated_at from INSERT and let it use the default value."
  }

  if (results.test3?.success && !results.test2?.success) {
    return "Use minimal INSERT with only required fields and let defaults handle the rest."
  }

  if (results.test4?.success) {
    return "INSERT works but UPDATE might be the issue. Check the registration flow logic."
  }

  return "All tests failed. There might be a deeper database or permission issue."
}
