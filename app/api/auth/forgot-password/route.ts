import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { Resend } from "resend"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("Password reset requested for:", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${email}
    `

    console.log("Users found:", users.length)

    if (users.length === 0) {
      console.log("No user found with email:", email)
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: "If an account with that email exists, we have sent a password reset link.",
      })
    }

    const user = users[0]
    console.log("User found:", user.email, user.first_name)

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store reset token in database
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
    `

    console.log("Reset token stored for user:", user.id)

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    console.log("Reset URL:", resetUrl)

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured")
      return NextResponse.json(
        {
          message: "Email service not configured. Please contact support.",
        },
        { status: 500 },
      )
    }

    console.log("Resend API Key configured:", process.env.RESEND_API_KEY ? "Yes" : "No")

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send email with Resend
    try {
      console.log("Attempting to send email...")

      const emailResult = await resend.emails.send({
        from: "Digital Signage <onboarding@resend.dev>", // Use Resend's test domain
        to: [email],
        subject: "Reset Your Password - Digital Signage Platform",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">Digital Signage Platform</h1>
            </div>
            
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hi ${user.first_name || "there"},</p>
            <p>You requested to reset your password for your Digital Signage Platform account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">
                <strong>Security Notice:</strong><br>
                • This link will expire in 1 hour<br>
                • If you didn't request this, please ignore this email<br>
                • Your password won't change until you click the link above
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                Digital Signage Platform<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        `,
      })

      console.log("Email send result:", emailResult)

      if (emailResult.error) {
        console.error("Resend API error:", emailResult.error)
        throw new Error(emailResult.error.message || "Failed to send email")
      }

      console.log("Password reset email sent successfully to:", email)
      console.log("Email ID:", emailResult.data?.id)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)

      // For debugging, return the actual error in development
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          {
            error: "Email sending failed: " + (emailError as Error).message,
            resetUrl, // Include reset URL for testing
          },
          { status: 500 },
        )
      }

      // In production, still return success to not reveal if email exists
      return NextResponse.json({
        message: "If an account with that email exists, we have sent a password reset link.",
        note: "Email service temporarily unavailable",
      })
    }

    return NextResponse.json({
      message: "Password reset email sent successfully! Check your inbox.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      {
        error: "Internal server error: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
