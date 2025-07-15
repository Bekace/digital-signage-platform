import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS API] GET request received")

    // Check authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🎵 [PLAYLISTS API] Auth header present:", !!authHeader)
    console.log("🎵 [PLAYLISTS API] Auth header value:", authHeader?.substring(0, 20) + "...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          debug: {
            authHeader: !!authHeader,
            authHeaderFormat: authHeader?.startsWith("Bearer ") ? "correct" : "incorrect",
          },
        },
        { status: 401 },
      )
    }

    console.log("🎵 [PLAYLISTS API] Authenticated user:", user.id, user.email)

    // Get playlists for the user - removed deleted_at filter since column doesn't exist
    const playlists = await sql`
      SELECT 
        id, 
        name, 
        description, 
        status, 
        loop_enabled, 
        schedule_enabled, 
        start_time, 
        end_time, 
        selected_days, 
        created_at, 
        updated_at,
        user_id
      FROM playlists 
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC
    `

    console.log("🎵 [PLAYLISTS API] Found", playlists.length, "playlists for user", user.id)

    // Get item counts for each playlist
    const playlistsWithCounts = await Promise.all(
      playlists.map(async (playlist) => {
        try {
          const itemCount = await sql`
            SELECT COUNT(*) as count 
            FROM playlist_items 
            WHERE playlist_id = ${playlist.id}
          `
          return {
            ...playlist,
            item_count: Number.parseInt(itemCount[0].count) || 0,
            device_count: 0, // Default values for missing data
            total_duration: 0,
            assigned_devices: [],
          }
        } catch (error) {
          console.error("Error getting item count for playlist", playlist.id, ":", error)
          return {
            ...playlist,
            item_count: 0,
            device_count: 0,
            total_duration: 0,
            assigned_devices: [],
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      playlists: playlistsWithCounts,
      total: playlistsWithCounts.length,
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Error:", error)
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
  try {
    console.log("🎵 [PLAYLISTS API] POST request received")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [PLAYLISTS API] No authenticated user found for POST")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    console.log("🎵 [PLAYLISTS API] Creating playlist:", name, "for user:", user.id)

    const result = await sql`
      INSERT INTO playlists (
        name, 
        description, 
        user_id, 
        status, 
        loop_enabled, 
        schedule_enabled, 
        created_at, 
        updated_at
      ) VALUES (
        ${name}, 
        ${description || ""}, 
        ${user.id}, 
        'draft', 
        true, 
        false, 
        NOW(), 
        NOW()
      ) RETURNING *
    `

    const playlist = result[0]
    console.log("🎵 [PLAYLISTS API] Created playlist:", playlist.id)

    return NextResponse.json({
      success: true,
      playlist,
      message: "Playlist created successfully",
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS API] Error creating playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
