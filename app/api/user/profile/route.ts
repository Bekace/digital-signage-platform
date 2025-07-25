import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Get complete user profile including company info and admin status
    const users = await sql`
      SELECT 
        id, email, first_name, last_name, company, 
        company_address, company_phone, plan, created_at, role
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
        companyName: userData.company, // Add this for header compatibility
        companyAddress: userData.company_address,
        companyPhone: userData.company_phone,
        plan: userData.plan,
        createdAt: userData.created_at,
        isAdmin: userData.role === "admin",
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
