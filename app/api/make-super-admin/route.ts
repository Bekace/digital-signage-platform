import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [MAKE SUPER ADMIN] Starting process...")

    const email = "bekace.multimedia@gmail.com"
    console.log(`Looking for user: ${email}`)

    // Get the user ID - EXACT same pattern as database-test-form
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${email}
    `

    console.log(`Found ${users.length} users`)

    if (users.length === 0) {
      console.log("❌ User not found")
      return NextResponse.json(
        {
          success: false,
          error: `User with email ${email} not found`,
        },
        { status: 404 },
      )
    }

    const user = users[0]
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (ID: ${user.id})`)

    // Check if admin record exists
    const existingAdmin = await sql`
      SELECT id, role, permissions 
      FROM admin_users 
      WHERE user_id = ${user.id}
    `

    console.log(`Found ${existingAdmin.length} existing admin records`)

    const permissions = {
      users: { create: true, read: true, update: true, delete: true },
      media: { create: true, read: true, update: true, delete: true },
      playlists: { create: true, read: true, update: true, delete: true },
      devices: { create: true, read: true, update: true, delete: true },
      screens: { create: true, read: true, update: true, delete: true },
      plans: { create: true, read: true, update: true, delete: true },
      features: { create: true, read: true, update: true, delete: true },
      admin: { create: true, read: true, update: true, delete: true },
      system: { database: true, debug: true, maintenance: true },
    }

    let action = ""

    if (existingAdmin.length > 0) {
      // Update existing admin record
      await sql`
        UPDATE admin_users 
        SET 
          role = 'super_admin',
          permissions = ${JSON.stringify(permissions)}
        WHERE user_id = ${user.id}
      `
      action = "updated"
      console.log(`🔄 Updated existing admin record for user ID: ${user.id}`)
    } else {
      // Create new admin record
      await sql`
        INSERT INTO admin_users (user_id, role, permissions)
        VALUES (${user.id}, 'super_admin', ${JSON.stringify(permissions)})
      `
      action = "created"
      console.log(`✨ Created new admin record for user ID: ${user.id}`)
    }

    // Check if is_admin column exists and update it
    try {
      const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_admin'
      `

      if (columns.length > 0) {
        await sql`
          UPDATE users 
          SET is_admin = true 
          WHERE id = ${user.id}
        `
        console.log(`🔄 Updated is_admin flag in users table for user ID: ${user.id}`)
      } else {
        console.log("ℹ️  is_admin column doesn't exist in users table")
      }
    } catch (error) {
      console.log("ℹ️  Could not check/update is_admin column:", error)
    }

    // Verify the result
    const verification = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        COALESCE(u.is_admin, false) as is_admin_flag,
        au.role,
        au.permissions,
        au.created_at as admin_created_at
      FROM users u
      LEFT JOIN admin_users au ON u.id = au.user_id
      WHERE u.email = ${email}
    `

    const result = verification[0]

    console.log("✅ [MAKE SUPER ADMIN] Success!")

    return NextResponse.json({
      success: true,
      message: `Super admin ${action} successfully`,
      user: {
        id: result.id,
        email: result.email,
        firstName: result.first_name,
        lastName: result.last_name,
        isAdminFlag: result.is_admin_flag,
        adminRole: result.role,
        adminCreated: result.admin_created_at,
        permissions: result.permissions,
      },
    })
  } catch (error) {
    console.error("❌ [MAKE SUPER ADMIN] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to make user super admin",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
