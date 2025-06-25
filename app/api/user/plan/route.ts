import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 [PLAN API] Starting plan fetch...")

    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAN API] No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [PLAN API] User found:", { id: user.id, email: user.email })

    const sql = getDb()

    // Get user's current usage and plan with detailed logging
    console.log("🔍 [PLAN API] Querying user data for ID:", user.id)
    const userResult = await sql`
      SELECT 
        id,
        email,
        plan_type, 
        media_files_count, 
        storage_used_bytes, 
        screens_count, 
        plan_expires_at,
        created_at,
        updated_at
      FROM users 
      WHERE id = ${user.id}
    `

    console.log("📊 [PLAN API] Raw user query result:", userResult)

    if (userResult.length === 0) {
      console.log("❌ [PLAN API] User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userResult[0]
    console.log("✅ [PLAN API] User data retrieved:", {
      id: userData.id,
      email: userData.email,
      plan_type: userData.plan_type,
      media_files_count: userData.media_files_count,
      storage_used_bytes: userData.storage_used_bytes,
      screens_count: userData.screens_count,
    })

    // Get plan limits with detailed logging
    const planType = userData.plan_type || "free"
    console.log("🔍 [PLAN API] Looking up plan limits for:", planType)

    const planResult = await sql`
      SELECT * FROM plan_limits 
      WHERE plan_type = ${planType}
    `

    console.log("📊 [PLAN API] Plan limits query result:", planResult)

    if (planResult.length === 0) {
      console.log("❌ [PLAN API] Plan not found, using default free plan")
      // Return default free plan if not found
      const defaultResponse = {
        usage: {
          media_files_count: userData.media_files_count || 0,
          storage_used_bytes: userData.storage_used_bytes || 0,
          screens_count: userData.screens_count || 0,
          plan_type: userData.plan_type || "free",
        },
        limits: {
          plan_type: "free",
          max_media_files: 5,
          max_storage_bytes: 104857600, // 100MB
          max_screens: 1,
          price_monthly: 0,
          features: ["Basic templates", "Limited storage", "Community support"],
        },
        plan_expires_at: userData.plan_expires_at,
      }
      console.log("📤 [PLAN API] Returning default response:", defaultResponse)
      return NextResponse.json(defaultResponse)
    }

    const planLimits = planResult[0]
    console.log("✅ [PLAN API] Plan limits found:", planLimits)

    // Also get real-time media count to ensure accuracy
    console.log("🔍 [PLAN API] Getting real-time media count...")
    const mediaCountResult = await sql`
      SELECT 
        COUNT(*) as actual_media_count,
        COALESCE(SUM(file_size), 0) as actual_storage_used
      FROM media_files 
      WHERE user_id = ${user.id} AND deleted_at IS NULL
    `

    console.log("📊 [PLAN API] Real-time media stats:", mediaCountResult[0])

    const actualStats = mediaCountResult[0]
    const actualMediaCount = Number(actualStats.actual_media_count)
    const actualStorageUsed = Number(actualStats.actual_storage_used)

    // Check if user table needs updating
    if (actualMediaCount !== userData.media_files_count || actualStorageUsed !== userData.storage_used_bytes) {
      console.log("🔄 [PLAN API] Updating user stats in database...")
      await sql`
        UPDATE users 
        SET 
          media_files_count = ${actualMediaCount},
          storage_used_bytes = ${actualStorageUsed},
          updated_at = NOW()
        WHERE id = ${user.id}
      `
      console.log("✅ [PLAN API] User stats updated")
    }

    const response = {
      usage: {
        media_files_count: actualMediaCount,
        storage_used_bytes: actualStorageUsed,
        screens_count: userData.screens_count || 0,
        plan_type: userData.plan_type || "free",
      },
      limits: planLimits,
      plan_expires_at: userData.plan_expires_at,
      debug: {
        user_table_media_count: userData.media_files_count,
        actual_media_count: actualMediaCount,
        user_table_storage: userData.storage_used_bytes,
        actual_storage: actualStorageUsed,
        plan_type: planType,
        timestamp: new Date().toISOString(),
      },
    }

    console.log("📤 [PLAN API] Final response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [PLAN API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch plan information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
