import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "No authentication token" }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; email: string }

    // Get user from database
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at
      FROM users 
      WHERE id = ${decoded.userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const user = users[0]

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "No authentication token" }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; email: string }

    const body = await request.json()
    const { firstName, lastName, company } = body

    // Update user in database
    const result = await sql`
      UPDATE users 
      SET first_name = ${firstName}, last_name = ${lastName}, company = ${company}
      WHERE id = ${decoded.userId}
      RETURNING id, email, first_name, last_name, company, plan, created_at
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const user = result[0]

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company,
        plan: user.plan,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
