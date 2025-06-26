import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch all playlists for the current user
export async function GET() {
  console.log("🎵 [PLAYLISTS API] Starting GET request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`🔍 [PLAYLISTS API] Fetching playlists for user: ${user.id}`)
    const sql = getDb()

    // First, let's check if the playlists table exists
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
          error: "Playlists table not found. Please run database setup.",
          playlists: [],
          total: 0,
        },
        { status: 200 },
      )
    }

    // Fetch playlists with comprehensive data
    const playlists = await sql`
      SELECT 
        p.*,
        COALESCE(item_stats.item_count, 0) as item_count,
        COALESCE(device_stats.device_count, 0) as device_count,
        COALESCE(item_stats.total_duration, 0) as total_duration,
        COALESCE(device_stats.assigned_devices, '{}') as assigned_devices
      FROM playlists p
      LEFT JOIN (
        SELECT 
          playlist_id,
          COUNT(*) as item_count,
          SUM(COALESCE(pi.duration, COALESCE(mf.duration, 30))) as total_duration
        FROM playlist_items pi
        LEFT JOIN media_files mf ON pi.media_file_id = mf.id
        GROUP BY playlist_id
      ) item_stats ON p.id = item_stats.playlist_id
      LEFT JOIN (
        SELECT 
          playlist_id,
          COUNT(*) as device_count,
          ARRAY_AGG(d.name) as assigned_devices
        FROM playlist_assignments pa
        LEFT JOIN devices d ON pa.device_id = d.id
        GROUP BY playlist_id
      ) device_stats ON p.id = device_stats.playlist_id
      WHERE p.user_id = ${user.id}
      ORDER BY p.updated_at DESC
    `

    console.log(`✅ [PLAYLISTS API] Found ${playlists.length} playlists`)

    // Format the response
    const formattedPlaylists = playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      status: playlist.status,
      loop_enabled: playlist.loop_enabled,
      schedule_enabled: playlist.schedule_enabled,
      start_time: playlist.start_time,
      end_time: playlist.end_time,
      selected_days: playlist.selected_days || [],
      item_count: Number(playlist.item_count) || 0,
      device_count: Number(playlist.device_count) || 0,
      total_duration: Number(playlist.total_duration) || 0,
      assigned_devices: playlist.assigned_devices?.filter(Boolean) || [],
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
    }))

    return NextResponse.json({
      success: true,
      playlists: formattedPlaylists,
      total: playlists.length,
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error fetching playlists:", error)
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
