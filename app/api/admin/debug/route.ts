import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("Debug: Starting admin debug check")

    const user = await getCurrentUser()
    console.log("Debug: Current user:", user)

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated", step: "auth" }, { status: 401 })
    }

    const sql = getDb()
    console.log("Debug: Database connection established")

    // Check if admin_users table exists
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'admin_users'
      `
      console.log("Debug: admin_users table columns:", tableInfo)
    } catch (err) {
      console.log("Debug: Error checking admin_users table:", err)
    }

    // Check if user is admin using admin_users table
    try {
      const adminCheck = await sql`
        SELECT 
          u.id, 
          u.email, 
          au.role as admin_role,
          au.permissions as admin_permissions
        FROM users u
        LEFT JOIN admin_users au ON u.id = au.user_id
        WHERE u.id = ${user.id}
      `
      console.log("Debug: User admin check:", adminCheck)

      if (adminCheck.length === 0) {
        return NextResponse.json({ success: false, message: "User not found", step: "user_lookup" }, { status: 404 })
      }

      const userRecord = adminCheck[0]
      const isAdmin = userRecord.admin_role !== null && userRecord.admin_role !== undefined

      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            message: "Access denied - not admin",
            step: "admin_check",
            user: userRecord,
          },
          { status: 403 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Admin access confirmed",
        user: userRecord,
        step: "success",
      })
    } catch (err) {
      console.log("Debug: Error in admin check:", err)
      return NextResponse.json(
        {
          success: false,
          message: "Database error in admin check",
          error: err.message,
          step: "admin_check_error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Debug: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
        step: "general_error",
      },
      { status: 500 },
    )
  }
}
