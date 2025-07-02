import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user profile from database
    const result = await sql`
      SELECT id, email, name, company, role, created_at, plan_id
      FROM users 
      WHERE id = ${user.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userProfile = result[0]

    return NextResponse.json({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      company: userProfile.company,
      role: userProfile.role,
      createdAt: userProfile.created_at,
      planId: userProfile.plan_id || "starter",
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, company } = body

    // Update user profile
    const result = await sql`
      UPDATE users 
      SET name = ${name}, company = ${company}, updated_at = NOW()
      WHERE id = ${user.id}
      RETURNING id, email, name, company, role, created_at, plan_id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = result[0]

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      company: updatedUser.company,
      role: updatedUser.role,
      createdAt: updatedUser.created_at,
      planId: updatedUser.plan_id || "starter",
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
