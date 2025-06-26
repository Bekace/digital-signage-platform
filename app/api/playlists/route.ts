import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch all playlists for the current user
export async function GET() {
  console.log("🎵 [PLAYLISTS API] Starting GET request")

  try {
    // Test database connection first
    const sql = getDb()
    console.log("🎵 [PLAYLISTS API] Database connection established")

    // Test basic query
    const testQuery = await sql`SELECT 1 as test`
    console.log("🎵 [PLAYLISTS API] Database test query successful:", testQuery)

    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`🔍 [PLAYLISTS API] Fetching playlists for user: ${user.id}`)

    // Check if the playlists table exists
    let tableExists = false
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'playlists'
        );
      `
      tableExists = tableCheck[0]?.exists || false
      console.log("🎵 [PLAYLISTS API] Playlists table exists:", tableExists)
    } catch (error) {
      console.error("🎵 [PLAYLISTS API] Error checking table existence:", error)
      return NextResponse.json(
        {
          error: "Database schema error. Please run database setup.",
          details: error instanceof Error ? error.message : "Unknown error",
          playlists: [],
          total: 0,
        },
        { status: 500 },
      )
    }

    if (!tableExists) {
      console.log("❌ [PLAYLISTS API] Playlists table does not exist")
      return NextResponse.json(
        {
          success: true,
          message: "Playlists table not found. Please run database setup.",
          playlists: [],
          total: 0,
          needsSetup: true,
        },
        { status: 200 },
      )
    }

    // Try to fetch playlists with a simple query first
    let playlists = []
    try {
      console.log("🎵 [PLAYLISTS API] Attempting simple playlist query...")
      playlists = await sql`
        SELECT 
          id, name, description, status, loop_enabled, schedule_enabled,
          start_time, end_time, selected_days, created_at, updated_at
        FROM playlists 
        WHERE user_id = ${user.id}
        ORDER BY updated_at DESC
      `
      console.log(`🎵 [PLAYLISTS API] Simple query successful, found ${playlists.length} playlists`)
    } catch (error) {
      console.error("🎵 [PLAYLISTS API] Error in simple playlist query:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch playlists",
          details: error instanceof Error ? error.message : "Unknown error",
          playlists: [],
          total: 0,
        },
        { status: 500 },
      )
    }

    // If simple query works, try to get additional stats
    const playlistsWithStats = []
    for (const playlist of playlists) {
      try {
        // Get item count and duration
        let itemStats = { item_count: 0, total_duration: 0 }
        try {
          const itemStatsQuery = await sql`
            SELECT 
              COUNT(*) as item_count,
              COALESCE(SUM(COALESCE(pi.duration, 30)), 0) as total_duration
            FROM playlist_items pi
            WHERE pi.playlist_id = ${playlist.id}
          `
          if (itemStatsQuery.length > 0) {
            itemStats = {
              item_count: Number(itemStatsQuery[0].item_count) || 0,
              total_duration: Number(itemStatsQuery[0].total_duration) || 0,
            }
          }
        } catch (error) {
          console.log("🎵 [PLAYLISTS API] playlist_items table might not exist, using defaults")
        }

        // Get device assignments
        let deviceStats = { device_count: 0, assigned_devices: [] }
        try {
          const deviceStatsQuery = await sql`
            SELECT 
              COUNT(*) as device_count,
              ARRAY_AGG(d.name) as assigned_devices
            FROM playlist_assignments pa
            LEFT JOIN devices d ON pa.device_id = d.id
            WHERE pa.playlist_id = ${playlist.id}
          `
          if (deviceStatsQuery.length > 0 && deviceStatsQuery[0].device_count > 0) {
            deviceStats = {
              device_count: Number(deviceStatsQuery[0].device_count) || 0,
              assigned_devices: deviceStatsQuery[0].assigned_devices?.filter(Boolean) || [],
            }
          }
        } catch (error) {
          console.log("🎵 [PLAYLISTS API] playlist_assignments table might not exist, using defaults")
        }

        playlistsWithStats.push({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          status: playlist.status,
          loop_enabled: playlist.loop_enabled,
          schedule_enabled: playlist.schedule_enabled,
          start_time: playlist.start_time,
          end_time: playlist.end_time,
          selected_days: playlist.selected_days || [],
          item_count: itemStats.item_count,
          device_count: deviceStats.device_count,
          total_duration: itemStats.total_duration,
          assigned_devices: deviceStats.assigned_devices,
          created_at: playlist.created_at,
          updated_at: playlist.updated_at,
        })
      } catch (error) {
        console.error(`🎵 [PLAYLISTS API] Error processing playlist ${playlist.id}:`, error)
        // Add playlist with default stats if there's an error
        playlistsWithStats.push({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          status: playlist.status,
          loop_enabled: playlist.loop_enabled,
          schedule_enabled: playlist.schedule_enabled,
          start_time: playlist.start_time,
          end_time: playlist.end_time,
          selected_days: playlist.selected_days || [],
          item_count: 0,
          device_count: 0,
          total_duration: 0,
          assigned_devices: [],
          created_at: playlist.created_at,
          updated_at: playlist.updated_at,
        })
      }
    }

    console.log(`✅ [PLAYLISTS API] Successfully processed ${playlistsWithStats.length} playlists`)

    return NextResponse.json({
      success: true,
      playlists: playlistsWithStats,
      total: playlistsWithStats.length,
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        playlists: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}

// POST - Create a new playlist
export async function POST(request: Request) {
  console.log("🎵 [PLAYLISTS API] Starting POST request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLISTS API] Request body:", body)

    const {
      name,
      description,
      loop_enabled = true,
      schedule_enabled = false,
      start_time,
      end_time,
      selected_days = [],
    } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      console.log("❌ [PLAYLISTS API] Missing playlist name")
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    // Validate schedule data if scheduling is enabled
    if (schedule_enabled) {
      if (!start_time || !end_time) {
        console.log("❌ [PLAYLISTS API] Missing schedule times")
        return NextResponse.json(
          {
            error: "Start time and end time are required when scheduling is enabled",
          },
          { status: 400 },
        )
      }
      if (selected_days.length === 0) {
        console.log("❌ [PLAYLISTS API] Missing selected days")
        return NextResponse.json(
          {
            error: "At least one day must be selected when scheduling is enabled",
          },
          { status: 400 },
        )
      }
    }

    const sql = getDb()

    // Check if playlists table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'playlists'
      );
    `

    if (!tableCheck[0].exists) {
      console.log("❌ [PLAYLISTS API] Playlists table does not exist")
      return NextResponse.json(
        {
          error: "Playlists table not found. Please run database setup first.",
        },
        { status: 400 },
      )
    }

    // Create the playlist
    console.log(`🔨 [PLAYLISTS API] Creating playlist for user: ${user.id}`)
    const newPlaylist = await sql`
      INSERT INTO playlists (
        user_id, name, description, loop_enabled, schedule_enabled,
        start_time, end_time, selected_days
      )
      VALUES (
        ${user.id}, ${name.trim()}, ${description || null}, ${loop_enabled}, 
        ${schedule_enabled}, ${start_time || null}, ${end_time || null}, 
        ${selected_days}
      )
      RETURNING *
    `

    const playlist = newPlaylist[0]
    console.log(`✅ [PLAYLISTS API] Created playlist with ID: ${playlist.id}`)

    return NextResponse.json(
      {
        success: true,
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          status: playlist.status,
          loop_enabled: playlist.loop_enabled,
          schedule_enabled: playlist.schedule_enabled,
          start_time: playlist.start_time,
          end_time: playlist.end_time,
          selected_days: playlist.selected_days || [],
          item_count: 0,
          device_count: 0,
          total_duration: 0,
          assigned_devices: [],
          created_at: playlist.created_at,
          updated_at: playlist.updated_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error creating playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
