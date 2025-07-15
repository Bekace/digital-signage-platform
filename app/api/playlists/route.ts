import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("🎵 [PLAYLISTS API] Starting GET request")

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [PLAYLISTS API] User authenticated:", user.id)

    const sql = getDb()

    // Get playlists with item counts - only using columns that exist
    const playlists = await sql`
      SELECT 
        p.id,
        p.user_id,
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
        COUNT(pi.id) as item_count
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.user_id, p.name, p.description, p.status, p.loop_enabled, 
               p.schedule_enabled, p.start_time, p.end_time, p.selected_days, 
               p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `

    // Add default values for missing data
    const playlistsWithCounts = playlists.map((playlist) => ({
      ...playlist,
      device_count: 0,
      total_duration: 0,
      assigned_devices: [],
    }))

    console.log(`✅ [PLAYLISTS API] Found ${playlists.length} playlists`)

    return NextResponse.json({
      success: true,
      playlists: playlistsWithCounts,
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error:", error)
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

export async function POST(request: NextRequest) {
  console.log("➕ [PLAYLISTS API] Starting POST request")

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("❌ [PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLISTS API] Request body:", body)

    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const sql = getDb()

    // Create new playlist - only using columns that exist
    const newPlaylist = await sql`
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
        ${name}, 
        ${description || ""}, 
        'draft', 
        true, 
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    console.log(`✅ [PLAYLISTS API] Created playlist: ${newPlaylist[0].id}`)

    return NextResponse.json({
      success: true,
      playlist: {
        ...newPlaylist[0],
        item_count: 0,
        device_count: 0,
        total_duration: 0,
        assigned_devices: [],
      },
    })
  } catch (error) {
    console.error("❌ [PLAYLISTS API] Error:", error)
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
