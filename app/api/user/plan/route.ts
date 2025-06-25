import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [PLAN API] === STARTING PLAN FETCH ===")

    const user = await getCurrentUser()
    console.log("🔍 [PLAN API] Current user:", user ? { id: user.id, email: user.email } : "NO USER")

    if (!user) {
      console.log("❌ [PLAN API] No user authenticated")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Get user's current plan and usage with detailed logging
    console.log("🔍 [PLAN API] Querying user data for ID:", user.id)
    const userData = await sql`
      SELECT 
        id,
        email,
        plan_type,
        media_files_count,
        storage_used_bytes,
        created_at,
        updated_at
      FROM users 
      WHERE id = ${user.id}
    `

    console.log("📊 [PLAN API] User data query result:", userData)

    if (userData.length === 0) {
      console.log("❌ [PLAN API] User not found in database")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userRecord = userData[0]
    console.log("✅ [PLAN API] User record found:", {
      id: userRecord.id,
      email: userRecord.email,
      plan_type: userRecord.plan_type,
      media_files_count: userRecord.media_files_count,
      storage_used_bytes: userRecord.storage_used_bytes,
    })

    // Get actual media count and storage from media table
    console.log("🔍 [PLAN API] Querying actual media data for user:", user.id)
    const actualMediaData = await sql`
      SELECT 
        COUNT(*) as actual_count,
        COALESCE(SUM(file_size), 0) as actual_storage
      FROM media_files 
      WHERE user_id = ${user.id} AND deleted_at IS NULL
    `

    console.log("📊 [PLAN API] Actual media data:", actualMediaData[0])

    // Get screens count
    console.log("🔍 [PLAN API] Querying screens count for user:", user.id)
    const screensData = await sql`
      SELECT COUNT(*) as screens_count
      FROM screens 
      WHERE user_id = ${user.id}
    `

    console.log("📊 [PLAN API] Screens data:", screensData[0])

    // Get plan limits from plan_templates table
    const userPlanType = userRecord.plan_type || "free"
    console.log("🔍 [PLAN API] Looking up plan template for plan_type:", userPlanType)

    const planLimits = await sql`
      SELECT 
        id,
        plan_type,
        name,
        max_media_files,
        max_storage_bytes,
        max_screens,
        price_monthly,
        price_yearly,
        features,
        is_active
      FROM plan_templates 
      WHERE plan_type = ${userPlanType} AND is_active = true
      LIMIT 1
    `

    console.log("📊 [PLAN API] Plan template query result:", planLimits)

    if (planLimits.length === 0) {
      console.log("❌ [PLAN API] No active plan template found for:", userPlanType)
      console.log("🔍 [PLAN API] Checking all available plan templates...")

      const allPlans = await sql`
        SELECT plan_type, name, is_active FROM plan_templates ORDER BY plan_type
      `
      console.log("📊 [PLAN API] All available plans:", allPlans)

      return NextResponse.json(
        {
          success: false,
          message: `Plan template not found for plan type: ${userPlanType}`,
          debug: {
            user_plan_type: userPlanType,
            available_plans: allPlans,
          },
        },
        { status: 404 },
      )
    }

    const limits = planLimits[0]
    console.log("✅ [PLAN API] Plan template found:", {
      id: limits.id,
      plan_type: limits.plan_type,
      name: limits.name,
      max_media_files: limits.max_media_files,
      max_storage_bytes: limits.max_storage_bytes,
      max_screens: limits.max_screens,
      is_active: limits.is_active,
    })

    const actualMedia = actualMediaData[0]
    const screens = screensData[0]

    // Update user table if counts are out of sync
    const userTableMediaCount = Number(userRecord.media_files_count) || 0
    const userTableStorage = Number(userRecord.storage_used_bytes) || 0
    const actualMediaCount = Number(actualMedia.actual_count) || 0
    const actualStorageUsed = Number(actualMedia.actual_storage) || 0

    if (userTableMediaCount !== actualMediaCount || userTableStorage !== actualStorageUsed) {
      console.log(
        `🔄 [PLAN API] Syncing user data - Media: ${userTableMediaCount} → ${actualMediaCount}, Storage: ${userTableStorage} → ${actualStorageUsed}`,
      )

      await sql`
        UPDATE users 
        SET 
          media_files_count = ${actualMediaCount},
          storage_used_bytes = ${actualStorageUsed}
        WHERE id = ${user.id}
      `
      console.log("✅ [PLAN API] User data synced")
    }

    const responseData = {
      usage: {
        media_files_count: actualMediaCount,
        storage_used_bytes: actualStorageUsed,
        screens_count: Number(screens.screens_count) || 0,
        plan_type: userRecord.plan_type,
      },
      limits: {
        id: limits.id,
        plan_type: limits.plan_type,
        name: limits.name,
        max_media_files: Number(limits.max_media_files),
        max_storage_bytes: Number(limits.max_storage_bytes),
        max_screens: Number(limits.max_screens),
        price_monthly: Number(limits.price_monthly),
        price_yearly: Number(limits.price_yearly),
        features: typeof limits.features === "string" ? JSON.parse(limits.features) : limits.features || [],
      },
      plan_expires_at: null,
      debug: {
        user_id: user.id,
        user_email: user.email,
        user_plan_type_from_db: userRecord.plan_type,
        plan_template_found: limits.plan_type,
        plan_template_name: limits.name,
        user_table_media_count: userTableMediaCount,
        actual_media_count: actualMediaCount,
        user_table_storage: userTableStorage.toString(),
        actual_storage: actualStorageUsed,
        timestamp: new Date().toISOString(),
      },
    }

    console.log(`📤 [PLAN API] === FINAL RESPONSE ===`)
    console.log(`📤 [PLAN API] User: ${user.email} (${user.id})`)
    console.log(`📤 [PLAN API] Plan Type: ${userRecord.plan_type}`)
    console.log(`📤 [PLAN API] Plan Name: ${limits.name}`)
    console.log(
      `📤 [PLAN API] Limits: ${limits.max_media_files} files, ${limits.max_storage_bytes} bytes, ${limits.max_screens} screens`,
    )
    console.log(`📤 [PLAN API] === END RESPONSE ===`)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ [PLAN API] ERROR:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch user plan data" }, { status: 500 })
  }
}
