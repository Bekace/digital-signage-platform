import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("💰 [ADMIN PLANS] Starting plans fetch...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all plans with their features
    const plans = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.billing_cycle,
        p.max_screens,
        p.max_media_storage_gb,
        p.is_active,
        p.created_at,
        p.updated_at,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN pf.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'id', pf.id,
                  'name', pf.name,
                  'featureKey', pf.feature_key
                )
              ELSE NULL
            END
          ) FILTER (WHERE pf.id IS NOT NULL), 
          '[]'::json
        ) as features
      FROM plans p
      LEFT JOIN plan_plan_features ppf ON p.id = ppf.plan_id
      LEFT JOIN plan_features pf ON ppf.feature_id = pf.id
      GROUP BY p.id, p.name, p.description, p.price, p.billing_cycle, p.max_screens, p.max_media_storage_gb, p.is_active, p.created_at, p.updated_at
      ORDER BY p.price ASC
    `

    console.log("💰 [ADMIN PLANS] Found plans:", plans.length)

    return NextResponse.json({
      success: true,
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingCycle: plan.billing_cycle,
        maxScreens: plan.max_screens,
        maxMediaStorageGb: plan.max_media_storage_gb,
        isActive: plan.is_active,
        features: plan.features || [],
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
      })),
    })
  } catch (error) {
    console.error("❌ [ADMIN PLANS] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("💰 [ADMIN PLANS] Creating new plan...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      billingCycle,
      maxScreens,
      maxMediaStorageGb,
      isActive = true,
      featureIds = [],
    } = body

    // Create new plan
    const newPlan = await sql`
      INSERT INTO plans (name, description, price, billing_cycle, max_screens, max_media_storage_gb, is_active)
      VALUES (${name}, ${description}, ${price}, ${billingCycle}, ${maxScreens}, ${maxMediaStorageGb}, ${isActive})
      RETURNING id, name, description, price, billing_cycle, max_screens, max_media_storage_gb, is_active, created_at
    `

    const planId = newPlan[0].id

    // Add features to plan
    if (featureIds.length > 0) {
      for (const featureId of featureIds) {
        await sql`
          INSERT INTO plan_plan_features (plan_id, feature_id)
          VALUES (${planId}, ${featureId})
        `
      }
    }

    console.log("💰 [ADMIN PLANS] Plan created:", planId)

    return NextResponse.json({
      success: true,
      plan: {
        id: newPlan[0].id,
        name: newPlan[0].name,
        description: newPlan[0].description,
        price: newPlan[0].price,
        billingCycle: newPlan[0].billing_cycle,
        maxScreens: newPlan[0].max_screens,
        maxMediaStorageGb: newPlan[0].max_media_storage_gb,
        isActive: newPlan[0].is_active,
        createdAt: newPlan[0].created_at,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN PLANS] Create error:", error)
    return NextResponse.json(
      {
        error: "Failed to create plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
