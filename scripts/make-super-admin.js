const { neon } = require("@neondatabase/serverless")

async function makeSuperAdmin() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    const sql = neon(process.env.DATABASE_URL)
    const email = "bekace.multimedia@gmail.com"

    console.log(`🔍 Looking for user: ${email}`)

    // Get the user ID
    const users = await sql`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      throw new Error(`User with email ${email} not found`)
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
      }
    } catch (error) {
      console.log("ℹ️  is_admin column may not exist in users table, skipping...")
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

    console.log("\n🎉 SUCCESS! Super admin", action, "successfully")
    console.log("📋 User Details:")
    console.log(`   • ID: ${result.id}`)
    console.log(`   • Email: ${result.email}`)
    console.log(`   • Name: ${result.first_name} ${result.last_name}`)
    console.log(`   • Admin Role: ${result.role}`)
    console.log(`   • Is Admin Flag: ${result.is_admin_flag}`)
    console.log(`   • Admin Created: ${result.admin_created_at}`)
    console.log("\n🔑 Permissions granted:")
    console.log(JSON.stringify(result.permissions, null, 2))
  } catch (error) {
    console.error("❌ Error making user super admin:", error)
    process.exit(1)
  }
}

makeSuperAdmin()
