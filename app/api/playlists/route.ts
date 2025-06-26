import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🎵 [PLAYLISTS API] Starting GET request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json(
        {
          error: "Unauthorized",
          success: false,
          playlists: [],
        },
        { status: 401 },
      )
    }

    console.log("✅ [PLAYLISTS API] User authenticated:", user.id)

    const sql = getDb()

    // Check if playlists table exists
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
          error: "Database schema error",
          success: false,
          playlists: [],
          needsSetup: true,
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

    // Get playlists with item counts
    let playlists = []
    try {
      playlists = await sql`
        SELECT 
          p.id,
          p.name,
          p.description,
          p.status,
          p.loop_enabled,
          p.schedule_enabled,
          p.start_time,
          p.end_time,
          p.selected_days,
          p.created_at,
          p.updated_at,
          COUNT(pi.id) as item_count,
          COALESCE(SUM(COALESCE(pi.duration, 30)), 0) as total_duration
        FROM playlists p
        LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
        WHERE p.user_id = ${user.id}
        GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
                 p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
        ORDER BY p.updated_at DESC
      `
    } catch (error) {
      console.error("❌ [PLAYLISTS API] Error fetching playlists:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch playlists",
          success: false,
          playlists: [],
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    console.log(`✅ [PLAYLISTS API] Found ${playlists.length} playlists`)

    const formattedPlaylists = playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      status: playlist.status,
      loop_enabled: playlist.loop_enabled,
      schedule_enabled: playlist.schedule_enabled,
      start_time: playlist.start_time,
      end_time: playlist.end_time,
      selected_days: Array.isArray(playlist.selected_days) ? playlist.selected_days : [],
      item_count: Number(playlist.item_count) || 0,
      device_count: 0, // TODO: Add device assignments
      total_duration: Number(playlist.total_duration) || 0,
      assigned_devices: [], // TODO: Add device assignments
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
    }))

    return NextResponse.json({
      success: true,
      playlists: formattedPlaylists,
      total: formattedPlaylists.length,
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
        playlists: [],
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("➕ [PLAYLISTS API] Starting POST request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json(
        {
          error: "Unauthorized",
          success: false,
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    console.log("📝 [PLAYLISTS API] Request body:", body)

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        {
          error: "Playlist name is required",
          success: false,
        },
        { status: 400 },
      )
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
          success: false,
        },
        { status: 400 },
      )
    }

    const newPlaylist = await sql`
      INSERT INTO playlists (
        user_id, 
        name, 
        description, 
        status,
        loop_enabled,
        schedule_enabled,
        start_time,
        end_time,
        selected_days,
        scale_image,
        scale_video,
        scale_document,
        shuffle,
        default_transition,
        transition_speed,
        auto_advance,
        background_color,
        text_overlay
      )
      VALUES (
        ${user.id},
        ${body.name.trim()},
        ${body.description?.trim() || null},
        ${body.status || "draft"},
        ${body.loop_enabled !== undefined ? body.loop_enabled : true},
        ${body.schedule_enabled !== undefined ? body.schedule_enabled : false},
        ${body.start_time || null},
        ${body.end_time || null},
        ${body.selected_days || []},
        ${body.scale_image || "fit"},
        ${body.scale_video || "fit"},
        ${body.scale_document || "fit"},
        ${body.shuffle !== undefined ? body.shuffle : false},
        ${body.default_transition || "fade"},
        ${body.transition_speed || "medium"},
        ${body.auto_advance !== undefined ? body.auto_advance : true},
        ${body.background_color || "black"},
        ${body.text_overlay !== undefined ? body.text_overlay : false}
      )
      RETURNING *
    `

    console.log(`✅ [PLAYLISTS API] Created playlist: ${newPlaylist[0].name}`)

    const formattedPlaylist = {
      id: newPlaylist[0].id,
      name: newPlaylist[0].name,
      description: newPlaylist[0].description,
      status: newPlaylist[0].status,
      loop_enabled: newPlaylist[0].loop_enabled,
      schedule_enabled: newPlaylist[0].schedule_enabled,
      start_time: newPlaylist[0].start_time,
      end_time: newPlaylist[0].end_time,
      selected_days: Array.isArray(newPlaylist[0].selected_days) ? newPlaylist[0].selected_days : [],
      item_count: 0,
      device_count: 0,
      total_duration: 0,
      assigned_devices: [],
      created_at: newPlaylist[0].created_at,
      updated_at: newPlaylist[0].updated_at,
    }

    return NextResponse.json(
      {
        success: true,
        playlist: formattedPlaylist,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to create playlist",
        success: false,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
