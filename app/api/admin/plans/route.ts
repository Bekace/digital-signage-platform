import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return false

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const result = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`

    return result.length > 0 && result[0].is_admin
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const plans = await sql`
      SELECT * FROM subscription_plans ORDER BY price ASC
    `

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error) {
    console.error("Admin plans GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch plans",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { name, price, max_media_files, max_storage_gb, max_screens, max_playlists, features } = body

    const result = await sql`
      INSERT INTO subscription_plans (
        name, price, max_media_files, max_storage_gb, 
        max_screens, max_playlists, features, created_at
      )
      VALUES (
        ${name}, ${price}, ${max_media_files}, ${max_storage_gb},
        ${max_screens}, ${max_playlists}, ${JSON.stringify(features)}, NOW()
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      plan: result[0],
    })
  } catch (error) {
    console.error("Admin plans POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create plan",
      },
      { status: 500 },
    )
  }
}
