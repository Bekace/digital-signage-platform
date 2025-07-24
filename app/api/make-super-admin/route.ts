import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("🔧 [MAKE SUPER ADMIN] Request for email:", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const sql = getDb()

    // First, check if user exists
    const users = await sql`
      SELECT id, email 
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      console.log("🔧 [MAKE SUPER ADMIN] User not found:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]
    console.log("🔧 [MAKE SUPER ADMIN] User found:", user.id, user.email)

    // Check if admin_users table exists, create if not
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `

    // Insert or update admin user
    const adminResult = await sql`
      INSERT INTO admin_users (user_id, role, permissions)
      VALUES (${user.id}, 'super_admin', '{"all": true}')
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        role = 'super_admin',
        permissions = '{"all": true}',
        updated_at = NOW()
      RETURNING *
    `

    // Create admin_logs table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(100),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log("✅ Super admin created/updated:", {
      user_id: user.id,
      email: user.email,
      role: adminResult[0].role,
    })

    return NextResponse.json({
      success: true,
      message: `Super admin privileges granted to ${email}`,
      admin: {
        user_id: user.id,
        email: user.email,
        role: adminResult[0].role,
        permissions: adminResult[0].permissions,
      },
    })
  } catch (error) {
    console.error("❌ Make super admin error:", error)
    return NextResponse.json(
      {
        error: "Failed to create super admin",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
