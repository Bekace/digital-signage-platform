import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch all playlists for the current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Fetch playlists with item counts and device assignments
    const playlists = await sql`
      SELECT 
        p.*,
        COUNT(DISTINCT pi.id) as item_count,
        COUNT(DISTINCT pa.device_id) as device_count,
        COALESCE(
          SUM(CASE 
            WHEN pi.duration IS NOT NULL THEN pi.duration 
            ELSE COALESCE(mf.duration, 30)
          END), 0
        ) as total_duration,
        ARRAY_AGG(DISTINCT d.name) FILTER (WHERE d.name IS NOT NULL) as assigned_devices
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      LEFT JOIN playlist_assignments pa ON p.id = pa.playlist_id
      LEFT JOIN devices d ON pa.device_id = d.id
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `

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
      item_count: Number.parseInt(playlist.item_count) || 0,
      device_count: Number.parseInt(playlist.device_count) || 0,
      total_duration: Number.parseInt(playlist.total_duration) || 0,
      assigned_devices: playlist.assigned_devices || [],
      created_at: playlist.created_at,
      updated_at: playlist.updated_at,
    }))

    return NextResponse.json({
      playlists: formattedPlaylists,
      total: playlists.length,
    })
  } catch (error) {
    console.error("Error fetching playlists:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create a new playlist
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
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
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    // Validate schedule data if scheduling is enabled
    if (schedule_enabled) {
      if (!start_time || !end_time) {
        return NextResponse.json(
          {
            error: "Start time and end time are required when scheduling is enabled",
          },
          { status: 400 },
        )
      }
      if (selected_days.length === 0) {
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
    console.error("Error creating playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
