import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, company, password, plan } = await request.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Demo registration - always succeeds
    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      token: "demo-token-12345",
      user: {
        id: "demo-user-" + Date.now(),
        email: email.toLowerCase(),
        firstName,
        lastName,
        company: company || null,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
