import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    console.log("🔍 [DEBUG] Checking database data...")

    // Get user from cookie if available
    const cookieHeader = request.headers.get("cookie")
    let userId = null
    let userEmail = "Not authenticated"

    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )

      if (cookies["auth-token"]) {
        try {
          const decoded = jwt.verify(cookies["auth-token"], process.env.JWT_SECRET!) as {
            userId: number
            email: string
          }
          userId = decoded.userId
          userEmail = decoded.email
        } catch (error) {
          console.log("Token verification failed:", error)
        }
      }
    }

    // Check all tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'devices', 'media_files', 'playlists', 'playlist_items')
      ORDER BY table_name
    `

    // Check users
    const users = await sql`SELECT id, email, first_name, last_name, company FROM users ORDER BY id`

    // Check devices for current user
    let devices = []
    if (userId) {
      devices = await sql`
        SELECT id, name, device_code, status, last_heartbeat, created_at 
        FROM devices 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
    }

    // Check all devices (for debugging)
    const allDevices = await sql`
      SELECT d.id, d.name, d.device_code, d.status, d.user_id, u.email as user_email
      FROM devices d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `

    // Check media files for current user
    let mediaFiles = []
    if (userId) {
      mediaFiles = await sql`
        SELECT id, filename, original_name, file_type, file_size, created_at
        FROM media_files 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
    }

    // Check all media files (for debugging)
    const allMediaFiles = await sql`
      SELECT m.id, m.filename, m.original_name, m.file_type, m.user_id, u.email as user_email
      FROM media_files m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
    `

    // Check playlists for current user
    let playlists = []
    if (userId) {
      playlists = await sql`
        SELECT id, name, description, status, created_at
        FROM playlists 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
    }

    // Check all playlists (for debugging)
    const allPlaylists = await sql`
      SELECT p.id, p.name, p.description, p.status, p.user_id, u.email as user_email
      FROM playlists p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `

    return NextResponse.json({
      success: true,
      current_user: {
        id: userId,
        email: userEmail,
      },
      database_info: {
        tables_exist: tables,
        total_users: users.length,
      },
      current_user_data: {
        devices: devices.length,
        media_files: mediaFiles.length,
        playlists: playlists.length,
      },
      detailed_data: {
        users: users,
        current_user_devices: devices,
        current_user_media: mediaFiles,
        current_user_playlists: playlists,
      },
      all_data_debug: {
        all_devices: allDevices,
        all_media_files: allMediaFiles,
        all_playlists: allPlaylists,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🔍 [DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
