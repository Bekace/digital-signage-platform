import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Get user's current plan and usage
    const userData = await sql`
      SELECT 
        plan_type,
        media_files_count,
        storage_used_bytes
      FROM users 
      WHERE id = ${user.id}
    `

    if (userData.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userPlan = userData[0]

    // Get actual media count and storage from media table
    const actualMediaData = await sql`
      SELECT 
        COUNT(*) as actual_count,
        COALESCE(SUM(file_size), 0) as actual_storage
      FROM media 
      WHERE user_id = ${user.id} AND deleted_at IS NULL
    `

    // Get screens count
    const screensData = await sql`
      SELECT COUNT(*) as screens_count
      FROM screens 
      WHERE user_id = ${user.id}
    `

    // Get plan limits from plan_templates table (not hardcoded)
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
        features
      FROM plan_templates 
      WHERE plan_type = ${userPlan.plan_type} AND is_active = true
      LIMIT 1
    `

    if (planLimits.length === 0) {
      return NextResponse.json(
        { success: false, message: `Plan template not found for plan type: ${userPlan.plan_type}` },
        { status: 404 },
      )
    }

    const limits = planLimits[0]
    const actualMedia = actualMediaData[0]
    const screens = screensData[0]

    // Update user table if counts are out of sync
    const userTableMediaCount = Number(userPlan.media_files_count) || 0
    const userTableStorage = Number(userPlan.storage_used_bytes) || 0
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
    }

    const responseData = {
      usage: {
        media_files_count: actualMediaCount,
        storage_used_bytes: actualStorageUsed,
        screens_count: Number(screens.screens_count) || 0,
        plan_type: userPlan.plan_type,
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
        user_table_media_count: userTableMediaCount,
        actual_media_count: actualMediaCount,
        user_table_storage: userTableStorage.toString(),
        actual_storage: actualStorageUsed,
        plan_type: userPlan.plan_type,
        limits_from_db: true,
      },
    }

    console.log(`📊 [PLAN API] Returning data for user ${user.id}:`, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Get user plan error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch user plan data" }, { status: 500 })
  }
}
