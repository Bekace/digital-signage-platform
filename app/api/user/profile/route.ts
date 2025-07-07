import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Get complete user profile including company info and admin status
    const users = await sql`
      SELECT 
        id, email, first_name, last_name, company, 
        company_address, company_phone, plan, created_at, is_admin
      FROM users 
      WHERE id = ${user.id}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userData = users[0]

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        company: userData.company,
        companyAddress: userData.company_address,
        companyPhone: userData.company_phone,
        plan: userData.plan,
        createdAt: userData.created_at,
        isAdmin: userData.is_admin || false,
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, company, companyAddress, companyPhone } = body

    const sql = getDb()

    // Update user in database
    const result = await sql`
      UPDATE users 
      SET first_name = ${firstName}, 
          last_name = ${lastName}, 
          company = ${company},
          company_address = ${companyAddress || null},
          company_phone = ${companyPhone || null}
      WHERE id = ${user.id}
      RETURNING id, email, first_name, last_name, company, company_address, company_phone, plan, created_at, is_admin
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userData = result[0]

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        company: userData.company,
        companyAddress: userData.company_address,
        companyPhone: userData.company_phone,
        plan: userData.plan,
        createdAt: userData.created_at,
        isAdmin: userData.is_admin || false,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
