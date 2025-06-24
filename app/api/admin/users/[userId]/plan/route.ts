import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${user.id} AND is_admin = true
    `

    if (adminCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const { plan } = await request.json()

    if (!plan || !["free", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ success: false, message: "Invalid plan" }, { status: 400 })
    }

    // Update user plan
    await sql`
      UPDATE users 
      SET plan = ${plan}
      WHERE id = ${params.userId}
    `

    return NextResponse.json({
      success: true,
      message: "User plan updated successfully",
    })
  } catch (error) {
    console.error("Update user plan error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
