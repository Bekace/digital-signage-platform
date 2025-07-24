import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const targetEmail = "bekace.multimedia@gmail.com"

    console.log("🔍 [SUPER ADMIN] Starting process for:", targetEmail)

    // Find the user
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${targetEmail}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: "User not found",
        email: targetEmail,
      })
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

    const superAdminPermissions = {
      users: { create: true, read: true, update: true, delete: true },
      media: { create: true, read: true, update: true, delete: true },
      playlists: { create: true, read: true, update: true, delete: true },
      screens: { create: true, read: true, update: true, delete: true },
      devices: { create: true, read: true, update: true, delete: true },
      plans: { create: true, read: true, update: true, delete: true },
      features: { create: true, read: true, update: true, delete: true },
      admin: { create: true, read: true, update: true, delete: true },
      system: { database: true, debug: true, maintenance: true },
    }

    let adminResult
    if (existingAdmin.length > 0) {
      // Update existing admin record
      adminResult = await sql`
        UPDATE admin_users 
        SET 
          role = 'super_admin',
          permissions = ${JSON.stringify(superAdminPermissions)}
        WHERE user_id = ${user.id}
        RETURNING id, role, permissions, created_at
      `
      console.log("✅ [SUPER ADMIN] Updated existing admin record")
    } else {
      // Create new admin record
      adminResult = await sql`
        INSERT INTO admin_users (user_id, role, permissions)
        VALUES (${user.id}, 'super_admin', ${JSON.stringify(superAdminPermissions)})
        RETURNING id, role, permissions, created_at
      `
      console.log("✅ [SUPER ADMIN] Created new admin record")
    }

    // Verify the setup
    const verification = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        au.role as admin_role,
        au.permissions as admin_permissions,
        au.created_at as admin_created_at
      FROM users u
      JOIN admin_users au ON u.id = au.user_id
      WHERE u.id = ${user.id}
      LIMIT 1
    `

    return NextResponse.json({
      success: true,
      message: "Super Admin Created Successfully",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        adminRole: verification[0].admin_role,
        adminPermissions: verification[0].admin_permissions,
        adminCreated: verification[0].admin_created_at,
      },
      action: existingAdmin.length > 0 ? "updated" : "created",
    })
  } catch (error) {
    console.error("❌ [SUPER ADMIN] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to make user super admin",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
