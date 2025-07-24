import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("🔧 [SUPER ADMIN] Starting super admin creation...")

    const targetEmail = "bekace.multimedia@gmail.com"

    // Find the user by email
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${targetEmail}
      LIMIT 1
    `

    if (users.length === 0) {
      console.log("❌ [SUPER ADMIN] User not found")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const user = users[0]
    console.log("✅ [SUPER ADMIN] User found:", user)

    // Check if admin record already exists
    const existingAdmin = await sql`
      SELECT id, role, permissions 
      FROM admin_users 
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    let adminResult
    if (existingAdmin.length > 0) {
      // Update existing admin record
      console.log("🔄 [SUPER ADMIN] Updating existing admin record...")
      adminResult = await sql`
        UPDATE admin_users 
        SET 
          role = 'super_admin',
          permissions = ${JSON.stringify({
            users: { create: true, read: true, update: true, delete: true },
            plans: { create: true, read: true, update: true, delete: true },
            features: { create: true, read: true, update: true, delete: true },
            media: { create: true, read: true, update: true, delete: true },
            playlists: { create: true, read: true, update: true, delete: true },
            devices: { create: true, read: true, update: true, delete: true },
            system: { database: true, debug: true, maintenance: true },
          })}
        WHERE user_id = ${user.id}
        RETURNING id, role, permissions
      `
    } else {
      // Create new admin record
      console.log("➕ [SUPER ADMIN] Creating new admin record...")
      adminResult = await sql`
        INSERT INTO admin_users (user_id, role, permissions)
        VALUES (
          ${user.id},
          'super_admin',
          ${JSON.stringify({
            users: { create: true, read: true, update: true, delete: true },
            plans: { create: true, read: true, update: true, delete: true },
            features: { create: true, read: true, update: true, delete: true },
            media: { create: true, read: true, update: true, delete: true },
            playlists: { create: true, read: true, update: true, delete: true },
            devices: { create: true, read: true, update: true, delete: true },
            system: { database: true, debug: true, maintenance: true },
          })}
        )
        RETURNING id, role, permissions
      `
    }

    console.log("✅ [SUPER ADMIN] Admin record result:", adminResult)

    // Verify the admin was created/updated
    const verifyAdmin = await sql`
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        au.role, au.permissions, au.created_at
      FROM users u
      JOIN admin_users au ON u.id = au.user_id
      WHERE u.id = ${user.id}
      LIMIT 1
    `

    console.log("🔍 [SUPER ADMIN] Verification result:", verifyAdmin)

    return NextResponse.json({
      success: true,
      message: "Super Admin Created Successfully",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        adminRole: verifyAdmin[0]?.role,
        adminCreated: verifyAdmin[0]?.created_at,
        permissions: verifyAdmin[0]?.permissions,
      },
    })
  } catch (error) {
    console.error("❌ [SUPER ADMIN] Error:", error)
    return NextResponse.json({ success: false, message: `Failed to make user super admin: ${error}` }, { status: 500 })
  }
}
