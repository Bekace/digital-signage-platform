const { neon } = require("@neondatabase/serverless")

// Make sure to set your DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function makeSuperAdmin() {
  const email = "bekace.multimedia@gmail.com"

  try {
    console.log(`🔍 Looking for user: ${email}`)

    // Get the user ID
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      console.error(`❌ User with email ${email} not found`)
      return
    }

    const user = users[0]
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (ID: ${user.id})`)

    // Check if admin record exists
    const existingAdmin = await sql`
      SELECT id, role, permissions 
      FROM admin_users 
      WHERE user_id = ${user.id}
    `

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

    if (existingAdmin.length > 0) {
      // Update existing admin record
      await sql`
        UPDATE admin_users 
        SET 
          role = 'super_admin',
          permissions = ${JSON.stringify(permissions)}
        WHERE user_id = ${user.id}
      `
      console.log(`🔄 Updated existing admin record for user ID: ${user.id}`)
    } else {
      // Create new admin record
      await sql`
        INSERT INTO admin_users (user_id, role, permissions)
        VALUES (${user.id}, 'super_admin', ${JSON.stringify(permissions)})
      `
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
      }
    } catch (error) {
      console.log("ℹ️  is_admin column may not exist in users table, skipping...")
    }

    // Verify the result
    console.log("\n📋 Verification:")
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

    if (verification.length > 0) {
      const result = verification[0]
      console.log(`✅ User: ${result.first_name} ${result.last_name}`)
      console.log(`✅ Email: ${result.email}`)
      console.log(`✅ User ID: ${result.id}`)
      console.log(`✅ Admin Role: ${result.role || "Not set"}`)
      console.log(`✅ Is Admin Flag: ${result.is_admin_flag}`)
      console.log(`✅ Admin Created: ${result.admin_created_at || "Not set"}`)
      console.log(`✅ Permissions: ${JSON.stringify(result.permissions, null, 2)}`)
    }

    console.log("\n🎉 Super admin setup completed successfully!")
  } catch (error) {
    console.error("❌ Error making user super admin:", error)
    process.exit(1)
  }
}

// Run the script
makeSuperAdmin()
