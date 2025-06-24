import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${currentUser.id}
    `

    if (!adminCheck[0]?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { plan_type } = await request.json()
    const userId = params.userId

    // Validate plan type
    if (!["free", "pro", "enterprise"].includes(plan_type)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    // Update user plan
    await sql`
      UPDATE users 
      SET plan_type = ${plan_type}
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
