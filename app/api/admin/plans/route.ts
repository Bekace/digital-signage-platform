import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

const PLAN_LIMITS = {
  free: {
    maxMediaFiles: 5,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB
    maxScreens: 1,
    priceMonthly: 0,
  },
  pro: {
    maxMediaFiles: 100,
    maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10GB
    maxScreens: 10,
    priceMonthly: 29,
  },
  enterprise: {
    maxMediaFiles: 1000,
    maxStorageBytes: 100 * 1024 * 1024 * 1024, // 100GB
    maxScreens: 100,
    priceMonthly: 99,
  },
}

export async function GET() {
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

    return NextResponse.json({
      success: true,
      plans: PLAN_LIMITS,
    })
  } catch (error) {
    console.error("Get plans error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
