import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

// GET all playlists for the current user
export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS] Fetching playlists...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [PLAYLISTS] No user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("🎵 [PLAYLISTS] User ID:", user.id)

    // Fetch playlists with item counts - using correct column names from database
    const playlists = await sql`
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
        COALESCE(SUM(pi.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
               p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
      ORDER BY p.created_at DESC
    `

    console.log("🎵 [PLAYLISTS] Found playlists:", playlists.length)

    // Format playlists to match frontend expectations
    const formattedPlaylists = playlists.map((playlist) => ({
      id: Number(playlist.id),
      name: String(playlist.name || "Untitled Playlist"),
      description: String(playlist.description || ""),
      status: String(playlist.status || "draft"),
      loop_enabled: Boolean(playlist.loop_enabled),
      schedule_enabled: Boolean(playlist.schedule_enabled),
      start_time: playlist.start_time,
      end_time: playlist.end_time,
      selected_days: Array.isArray(playlist.selected_days) ? playlist.selected_days : [],
      item_count: Number(playlist.item_count) || 0,
      device_count: 0, // TODO: Add device count query
      total_duration: Number(playlist.total_duration) || 0,
      assigned_devices: [], // TODO: Add assigned devices query
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
    }))

    return NextResponse.json({
      success: true,
      playlists: formattedPlaylists,
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST create new playlist
export async function POST(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS] Creating new playlist...")

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, loop_enabled = true, schedule_enabled = false } = body

    console.log("🎵 [PLAYLISTS] Create request:", { name, description, userId: user.id })

    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 })
    }

    // Create playlist using correct column names
    const result = await sql`
      INSERT INTO playlists (
        user_id, 
        name, 
        description, 
        status, 
        loop_enabled, 
        schedule_enabled, 
        created_at, 
        updated_at
      )
      VALUES (
        ${user.id}, 
        ${name.trim()}, 
        ${description?.trim() || null}, 
        'draft', 
        ${loop_enabled}, 
        ${schedule_enabled}, 
        NOW(), 
        NOW()
      )
      RETURNING id, name, description, status, loop_enabled, schedule_enabled, created_at, updated_at
    `

    console.log("🎵 [PLAYLISTS] Playlist created:", result[0])

    const newPlaylist = result[0]

    // Format response to match frontend expectations
    const formattedPlaylist = {
      id: Number(newPlaylist.id),
      name: String(newPlaylist.name),
      description: String(newPlaylist.description || ""),
      status: String(newPlaylist.status),
      loop_enabled: Boolean(newPlaylist.loop_enabled),
      schedule_enabled: Boolean(newPlaylist.schedule_enabled),
      start_time: null,
      end_time: null,
      selected_days: [],
      item_count: 0,
      device_count: 0,
      total_duration: 0,
      assigned_devices: [],
      created_at: newPlaylist.created_at,
      updated_at: newPlaylist.updated_at,
    }

    return NextResponse.json({
      success: true,
      message: "Playlist created successfully",
      playlist: formattedPlaylist,
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
