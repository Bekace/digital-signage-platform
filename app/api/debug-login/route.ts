import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG LOGIN] Starting login debug...")

    // Check database connection
    const connectionTest = await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")

    // Check users table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `

    console.log("📋 Users table structure:", tableInfo)

    // Get all users (without passwords for security)
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, is_admin, created_at,
             CASE WHEN password_hash IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status
      FROM users 
      ORDER BY created_at DESC
      LIMIT 10
    `

    console.log("👥 Users in database:", users.length)

    // Check for demo user specifically
    const demoUser = await sql`
      SELECT id, email, first_name, last_name, company, plan, is_admin, created_at,
             CASE WHEN password_hash IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status,
             LENGTH(password_hash) as password_length
      FROM users 
      WHERE email = 'demo@signagecloud.com'
      LIMIT 1
    `

    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    }

    return NextResponse.json({
      success: true,
      debug: {
        database: {
          connection: "OK",
          tableStructure: tableInfo,
          userCount: users.length,
          users: users,
        },
        demoUser: demoUser.length > 0 ? demoUser[0] : "NOT_FOUND",
        environment: envCheck,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG LOGIN] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, email, password } = await request.json()

    if (action === "create_demo_user") {
      // Create demo user with proper password hashing
      const hashedPassword = await bcrypt.hash("password123", 12)

      // First, check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = 'demo@signagecloud.com'
      `

      if (existingUser.length > 0) {
        // Update existing user
        await sql`
          UPDATE users 
          SET password_hash = ${hashedPassword},
              first_name = 'Demo',
              last_name = 'User',
              company = 'SignageCloud Demo',
              plan = 'monthly',
              is_admin = false
          WHERE email = 'demo@signagecloud.com'
        `
        return NextResponse.json({
          success: true,
          message: "Demo user updated successfully",
          action: "updated",
        })
      } else {
        // Create new user
        await sql`
          INSERT INTO users (email, password_hash, first_name, last_name, company, plan, is_admin)
          VALUES ('demo@signagecloud.com', ${hashedPassword}, 'Demo', 'User', 'SignageCloud Demo', 'monthly', false)
        `
        return NextResponse.json({
          success: true,
          message: "Demo user created successfully",
          action: "created",
        })
      }
    }

    if (action === "test_login" && email && password) {
      // Test login with provided credentials
      const users = await sql`
        SELECT id, email, first_name, last_name, password_hash
        FROM users 
        WHERE email = ${email.toLowerCase()}
        LIMIT 1
      `

      if (users.length === 0) {
        return NextResponse.json({
          success: false,
          message: "User not found",
          debug: { email, userExists: false },
        })
      }

      const user = users[0]
      let passwordValid = false

      try {
        passwordValid = await bcrypt.compare(password, user.password_hash)
      } catch (error) {
        // Try plain text comparison as fallback
        passwordValid = user.password_hash === password
      }

      return NextResponse.json({
        success: passwordValid,
        message: passwordValid ? "Login test successful" : "Invalid password",
        debug: {
          email,
          userExists: true,
          passwordValid,
          passwordHashLength: user.password_hash?.length || 0,
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid action",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("❌ [DEBUG LOGIN POST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
