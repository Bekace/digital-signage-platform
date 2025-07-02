import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log("Debug login attempt for:", email)

    // Check if user exists
    const userCheck = await sql`
      SELECT id, email, password_hash, first_name, last_name, company, plan
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    console.log("User found:", userCheck.length > 0)

    if (userCheck.length === 0) {
      return NextResponse.json({
        success: false,
        step: "user_lookup",
        message: "User not found",
        email_searched: email.toLowerCase(),
        total_users: await sql`SELECT COUNT(*) as count FROM users`.then((r) => r[0]?.count || 0),
      })
    }

    const user = userCheck[0]
    console.log("User data:", { id: user.id, email: user.email, has_password: !!user.password_hash })

    // Check password (simple comparison for demo)
    const passwordMatch = user.password_hash === password
    console.log("Password match:", passwordMatch)

    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        step: "password_verification",
        message: "Password does not match",
        provided_password_length: password.length,
        stored_password_length: user.password_hash?.length || 0,
      })
    }

    return NextResponse.json({
      success: true,
      step: "complete",
      message: "Login would succeed",
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        plan: user.plan,
      },
    })
  } catch (error) {
    console.error("Login debug error:", error)
    return NextResponse.json(
      {
        success: false,
        step: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        error_type: error?.constructor?.name || "Unknown",
      },
      { status: 500 },
    )
  }
}
