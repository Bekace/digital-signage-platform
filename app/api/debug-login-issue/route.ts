export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { generateToken, verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { action, email, password, userId } = await request.json()

    switch (action) {
      case "check_table_structure":
        return await checkTableStructure()

      case "check_demo_user":
        return await checkDemoUser(email)

      case "test_password_hash":
        return await testPasswordHash(email, password)

      case "test_jwt":
        return await testJWT(userId, email)

      case "test_specific_user":
        return await testSpecificUser(email, password)

      case "create_demo_user":
        return await createDemoUser()

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Debug API Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function checkTableStructure() {
  try {
    // Check if users table exists and get its structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `

    // Check if there are any users
    const userCount = await sql`SELECT COUNT(*) as count FROM users`

    // Get sample user data (without passwords)
    const sampleUsers = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at, is_admin
      FROM users 
      LIMIT 3
    `

    return NextResponse.json({
      success: true,
      message: `Users table found with ${tableInfo.length} columns and ${userCount[0].count} users`,
      data: {
        columns: tableInfo,
        userCount: userCount[0].count,
        sampleUsers,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to check table structure",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function checkDemoUser(email: string) {
  try {
    const users = await sql`
      SELECT id, email, first_name, last_name, company, plan, created_at, is_admin,
             CASE WHEN password_hash IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: `User with email ${email} not found`,
        data: { userExists: false },
      })
    }

    const user = users[0]
    return NextResponse.json({
      success: true,
      message: `User found: ${user.email}`,
      data: {
        userExists: true,
        user: user,
        hasPassword: user.password_status === "HAS_PASSWORD",
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to check demo user",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function testPasswordHash(email: string, password: string) {
  try {
    const users = await sql`
      SELECT id, email, password_hash
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: "User not found for password test",
        data: { userFound: false },
      })
    }

    const user = users[0]

    if (!user.password_hash) {
      return NextResponse.json({
        success: false,
        message: "User has no password hash stored",
        data: { hasPasswordHash: false },
      })
    }

    // Test password comparison
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    // Also test creating a new hash to verify bcrypt is working
    const testHash = await bcrypt.hash(password, 12)
    const testComparison = await bcrypt.compare(password, testHash)

    return NextResponse.json({
      success: isValidPassword,
      message: isValidPassword ? "Password matches stored hash" : "Password does not match stored hash",
      data: {
        userFound: true,
        hasPasswordHash: true,
        passwordMatches: isValidPassword,
        bcryptWorking: testComparison,
        hashPreview: user.password_hash.substring(0, 20) + "...",
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Password hash test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function testJWT(userId: number, email: string) {
  try {
    // Test JWT generation
    const token = generateToken({ userId, email })

    // Test JWT verification
    const decoded = verifyToken(token)

    return NextResponse.json({
      success: !!decoded,
      message: decoded ? "JWT generation and verification working" : "JWT verification failed",
      data: {
        tokenGenerated: !!token,
        tokenVerified: !!decoded,
        decodedPayload: decoded,
        jwtSecret: process.env.JWT_SECRET ? "SET" : "NOT_SET",
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "JWT test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function testSpecificUser(email: string, password: string) {
  try {
    console.log(`🔍 [DEBUG] Testing login for: ${email}`)

    // Step 1: Find user
    const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, company, plan, is_admin, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: `User not found: ${email}`,
        data: { step: "user_lookup", userFound: false },
      })
    }

    const user = users[0]
    console.log(`🔍 [DEBUG] User found: ${user.id}`)

    // Step 2: Check password
    if (!user.password_hash) {
      return NextResponse.json({
        success: false,
        message: "User has no password set",
        data: { step: "password_check", hasPassword: false, user: { id: user.id, email: user.email } },
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log(`🔍 [DEBUG] Password valid: ${isValidPassword}`)

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        message: "Invalid password",
        data: {
          step: "password_verification",
          passwordValid: false,
          user: { id: user.id, email: user.email },
          hashPreview: user.password_hash.substring(0, 20) + "...",
        },
      })
    }

    // Step 3: Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    console.log(`🔍 [DEBUG] Token generated successfully`)

    return NextResponse.json({
      success: true,
      message: "Login test successful",
      data: {
        step: "complete",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          company: user.company || "",
          plan: user.plan || "free",
          isAdmin: Boolean(user.is_admin),
        },
        tokenGenerated: !!token,
      },
    })
  } catch (error) {
    console.error("🔍 [DEBUG] Test specific user error:", error)
    return NextResponse.json({
      success: false,
      message: "Test failed with error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

async function createDemoUser() {
  try {
    const email = "demo@signagecloud.com"
    const password = "password123"

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id, email FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      // Update existing user
      const hashedPassword = await bcrypt.hash(password, 12)

      await sql`
        UPDATE users 
        SET password_hash = ${hashedPassword},
            first_name = 'Demo',
            last_name = 'User',
            company = 'SignageCloud Demo',
            plan = 'monthly',
            is_admin = false
        WHERE email = ${email}
      `

      return NextResponse.json({
        success: true,
        message: "Demo user updated successfully",
        data: { action: "updated", email },
      })
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 12)

      const newUsers = await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, company, plan, is_admin, created_at)
        VALUES (${email}, ${hashedPassword}, 'Demo', 'User', 'SignageCloud Demo', 'monthly', false, NOW())
        RETURNING id, email
      `

      return NextResponse.json({
        success: true,
        message: "Demo user created successfully",
        data: { action: "created", user: newUsers[0] },
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to create/update demo user",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
