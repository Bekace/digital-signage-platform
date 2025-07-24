import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAuth } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("📋 [ADMIN PLANS] Starting plans fetch...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      console.log("📋 [ADMIN PLANS] Access denied - not admin")
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log("📋 [ADMIN PLANS] Admin verified, fetching plans...")

    // Get all plans with their limits
    const plans = await sql`
      SELECT 
        id,
        name,
        plan_type,
        price_monthly,
        price_yearly,
        description,
        features,
        limits,
        is_active,
        created_at,
        updated_at
      FROM plans
      ORDER BY 
        CASE plan_type 
          WHEN 'free' THEN 1
          WHEN 'basic' THEN 2
          WHEN 'pro' THEN 3
          WHEN 'enterprise' THEN 4
          ELSE 5
        END
    `

    // Get user counts per plan
    const userCounts = await sql`
      SELECT plan_type, COUNT(*) as user_count
      FROM users
      GROUP BY plan_type
    `

    const userCountMap = userCounts.reduce(
      (acc, row) => {
        acc[row.plan_type] = Number.parseInt(row.user_count)
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("📋 [ADMIN PLANS] Found plans:", plans.length)

    return NextResponse.json({
      success: true,
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        type: plan.plan_type,
        priceMonthly: plan.price_monthly,
        priceYearly: plan.price_yearly,
        description: plan.description,
        features: plan.features,
        limits: plan.limits,
        isActive: plan.is_active,
        userCount: userCountMap[plan.plan_type] || 0,
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
    console.log("📋 [ADMIN PLANS] Creating new plan...")

    // Verify admin authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { name, type, priceMonthly, priceYearly, description, features, limits } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    // Check if plan type already exists
    const existingPlan = await sql`
      SELECT id FROM plans WHERE plan_type = ${type}
    `

    if (existingPlan.length > 0) {
      return NextResponse.json({ error: "Plan type already exists" }, { status: 409 })
    }

    // Create new plan
    const newPlan = await sql`
      INSERT INTO plans (name, plan_type, price_monthly, price_yearly, description, features, limits, is_active)
      VALUES (
        ${name}, 
        ${type}, 
        ${priceMonthly || 0}, 
        ${priceYearly || 0}, 
        ${description || ""}, 
        ${JSON.stringify(features || {})}, 
        ${JSON.stringify(limits || {})}, 
        true
      )
      RETURNING id, name, plan_type, price_monthly, price_yearly, description, features, limits, created_at
    `

    console.log("📋 [ADMIN PLANS] Plan created:", newPlan[0].id)

    return NextResponse.json({
      success: true,
      plan: {
        id: newPlan[0].id,
        name: newPlan[0].name,
        type: newPlan[0].plan_type,
        priceMonthly: newPlan[0].price_monthly,
        priceYearly: newPlan[0].price_yearly,
        description: newPlan[0].description,
        features: newPlan[0].features,
        limits: newPlan[0].limits,
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
