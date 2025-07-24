import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log("🔐 [LOGIN API] Login attempt for:", email)

    if (!email || !password) {
      console.log("🔐 [LOGIN API] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // First, let's check what columns exist in the users table
    console.log("🔐 [LOGIN API] Querying users table...")

    // Try different possible column names for plan
    const users = await sql`
      SELECT 
        id, 
        email, 
        password_hash,
        first_name, 
        last_name, 
        company,
        COALESCE(plan_type, plan, 'free') as plan,
        created_at
      FROM users 
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `

    console.log("🔐 [LOGIN API] Query result:", {
      found: users.length > 0,
      userCount: users.length,
    })

    if (users.length === 0) {
      console.log("🔐 [LOGIN API] User not found for email:", email)

      // Let's check if there are any users in the table at all
      const allUsers = await sql`SELECT email FROM users LIMIT 5`
      console.log(
        "🔐 [LOGIN API] Sample users in database:",
        allUsers.map((u) => u.email),
      )

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]
    console.log("🔐 [LOGIN API] User found:", {
      id: user.id,
      email: user.email,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length || 0,
      passwordHashStart: user.password_hash?.substring(0, 10) || "none",
    })

    // Check if password_hash exists
    if (!user.password_hash) {
      console.log("🔐 [LOGIN API] No password hash found for user")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    console.log("🔐 [LOGIN API] Comparing password with hash...")
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log("🔐 [LOGIN API] Password comparison result:", isValidPassword)

    if (!isValidPassword) {
      console.log("🔐 [LOGIN API] Password verification failed for:", email)

      // Let's also try to hash the provided password to see what it would look like
      const testHash = await bcrypt.hash(password, 10)
      console.log("🔐 [LOGIN API] Test hash of provided password:", testHash.substring(0, 20) + "...")

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error("🔐 [LOGIN API] JWT_SECRET not found in environment")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" })

    console.log("🔐 [LOGIN API] Login successful for:", email, "- Token generated")

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token: token,
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

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("🔐 [LOGIN API] Response created with cookie set")
    return response
  } catch (error) {
    console.error("❌ [LOGIN API] Login error:", error)
    console.error("❌ [LOGIN API] Error stack:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
