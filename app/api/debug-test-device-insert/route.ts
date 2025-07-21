import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { testMode } = await request.json()

    console.log("🔍 [DEBUG TEST INSERT] Starting device insert test...")

    // Test data similar to what device registration would use
    const testDeviceData = {
      name: `Test Device ${Date.now()}`,
      device_type: "web_browser",
      platform: "Win32",
      capabilities: JSON.stringify(["video", "image", "audio", "web"]),
      screen_resolution: "1920x1080",
      user_id: 1, // Assuming user 1 exists
      status: "online",
    }

    let insertResult = null
    let insertError = null

    // Test 1: Try insert with updated_at
    try {
      console.log("🔍 [DEBUG TEST INSERT] Test 1: Insert with updated_at")
      const result1 = await sql`
        INSERT INTO devices (
          name, device_type, platform, capabilities, screen_resolution, 
          user_id, status, created_at, updated_at
        ) VALUES (
          ${testDeviceData.name + " (with updated_at)"}, 
          ${testDeviceData.device_type}, 
          ${testDeviceData.platform}, 
          ${testDeviceData.capabilities}, 
          ${testDeviceData.screen_resolution}, 
          ${testDeviceData.user_id}, 
          ${testDeviceData.status}, 
          NOW(), 
          NOW()
        ) RETURNING *
      `
      insertResult = { test1: { success: true, data: result1[0] } }
    } catch (error) {
      insertError = { test1: { success: false, error: error instanceof Error ? error.message : "Unknown error" } }
      console.log("🔍 [DEBUG TEST INSERT] Test 1 failed:", error)
    }

    // Test 2: Try insert without updated_at
    try {
      console.log("🔍 [DEBUG TEST INSERT] Test 2: Insert without updated_at")
      const result2 = await sql`
        INSERT INTO devices (
          name, device_type, platform, capabilities, screen_resolution, 
          user_id, status, created_at
        ) VALUES (
          ${testDeviceData.name + " (without updated_at)"}, 
          ${testDeviceData.device_type}, 
          ${testDeviceData.platform}, 
          ${testDeviceData.capabilities}, 
          ${testDeviceData.screen_resolution}, 
          ${testDeviceData.user_id}, 
          ${testDeviceData.status}, 
          NOW()
        ) RETURNING *
      `
      if (!insertResult) insertResult = {}
      insertResult.test2 = { success: true, data: result2[0] }
    } catch (error) {
      if (!insertError) insertError = {}
      insertError.test2 = { success: false, error: error instanceof Error ? error.message : "Unknown error" }
      console.log("🔍 [DEBUG TEST INSERT] Test 2 failed:", error)
    }

    // Test 3: Try insert with explicit NULL for updated_at
    try {
      console.log("🔍 [DEBUG TEST INSERT] Test 3: Insert with NULL updated_at")
      const result3 = await sql`
        INSERT INTO devices (
          name, device_type, platform, capabilities, screen_resolution, 
          user_id, status, created_at, updated_at
        ) VALUES (
          ${testDeviceData.name + " (null updated_at)"}, 
          ${testDeviceData.device_type}, 
          ${testDeviceData.platform}, 
          ${testDeviceData.capabilities}, 
          ${testDeviceData.screen_resolution}, 
          ${testDeviceData.user_id}, 
          ${testDeviceData.status}, 
          NOW(), 
          NULL
        ) RETURNING *
      `
      if (!insertResult) insertResult = {}
      insertResult.test3 = { success: true, data: result3[0] }
    } catch (error) {
      if (!insertError) insertError = {}
      insertError.test3 = { success: false, error: error instanceof Error ? error.message : "Unknown error" }
      console.log("🔍 [DEBUG TEST INSERT] Test 3 failed:", error)
    }

    // Clean up test records if in test mode
    if (testMode) {
      try {
        await sql`DELETE FROM devices WHERE name LIKE 'Test Device%'`
        console.log("🔍 [DEBUG TEST INSERT] Cleaned up test records")
      } catch (cleanupError) {
        console.log("🔍 [DEBUG TEST INSERT] Cleanup failed:", cleanupError)
      }
    }

    // Get current device count
    const deviceCount = await sql`SELECT COUNT(*) as count FROM devices`

    return NextResponse.json({
      success: true,
      data: {
        insertResults: insertResult,
        insertErrors: insertError,
        testData: testDeviceData,
        currentDeviceCount: deviceCount[0]?.count || 0,
        analysis: {
          test1Success: insertResult?.test1?.success || false,
          test2Success: insertResult?.test2?.success || false,
          test3Success: insertResult?.test3?.success || false,
          recommendation:
            insertError?.test1 && insertResult?.test2
              ? "Remove updated_at from INSERT statement"
              : insertResult?.test1
                ? "updated_at column works fine"
                : "All insert methods failed - deeper issue exists",
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG TEST INSERT] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test device insert",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
