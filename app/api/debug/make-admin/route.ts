import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("Making bekace.multimedia@gmail.com an admin...")

    // First, check if the user exists
    const existingUser = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = 'bekace.multimedia@gmail.com'
      LIMIT 1
    `

    if (existingUser.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User bekace.multimedia@gmail.com not found",
        },
        { status: 404 },
      )
    }

    console.log("User found:", existingUser[0])

    // Check if is_admin column exists, if not create it
    try {
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
      `
      console.log("Added is_admin column if it didn't exist")
    } catch (error) {
      console.log("is_admin column might already exist:", error)
    }

    // Make the user an admin
    const result = await sql`
      UPDATE users 
      SET is_admin = TRUE 
      WHERE email = 'bekace.multimedia@gmail.com'
      RETURNING id, email, first_name, last_name, is_admin
    `

    console.log("Admin update result:", result)

    // Verify the update
    const verifyUser = await sql`
      SELECT id, email, first_name, last_name, is_admin 
      FROM users 
      WHERE email = 'bekace.multimedia@gmail.com'
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      message: "User successfully made admin",
      user: verifyUser[0],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error making user admin:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Check current admin status
    const adminUsers = await sql`
      SELECT id, email, first_name, last_name, is_admin 
      FROM users 
      WHERE is_admin = TRUE
    `

    const targetUser = await sql`
      SELECT id, email, first_name, last_name, is_admin 
      FROM users 
      WHERE email = 'bekace.multimedia@gmail.com'
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      admin_users: adminUsers,
      target_user: targetUser[0] || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
