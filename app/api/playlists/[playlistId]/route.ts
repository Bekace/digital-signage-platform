import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch a specific playlist with its items
export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log(`🎵 [PLAYLIST API] Getting playlist: ${params.playlistId}`)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const db = getDb()

    // Get playlist details
    const playlist = await db`
      SELECT * FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST API] Found playlist: ${playlist[0].name}`)

    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist[0].id,
        name: playlist[0].name,
        description: playlist[0].description,
        status: playlist[0].status,
        loop_enabled: playlist[0].loop_enabled,
        schedule_enabled: playlist[0].schedule_enabled,
        start_time: playlist[0].start_time,
        end_time: playlist[0].end_time,
        selected_days: playlist[0].selected_days || [],
        created_at: playlist[0].created_at,
        updated_at: playlist[0].updated_at,
      },
    })
  } catch (error) {
    console.error("❌ [PLAYLIST API] Error fetching playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update a playlist
export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log(`🎵 [PLAYLIST API] Updating playlist: ${params.playlistId}`)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, status, loop_enabled, schedule_enabled, start_time, end_time, selected_days } = body

    const db = getDb()

    // Verify ownership
    const existing = await db`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update playlist
    const updated = await db`
      UPDATE playlists SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        status = COALESCE(${status}, status),
        loop_enabled = COALESCE(${loop_enabled}, loop_enabled),
        schedule_enabled = COALESCE(${schedule_enabled}, schedule_enabled),
        start_time = CASE WHEN ${schedule_enabled} = false THEN NULL ELSE COALESCE(${start_time}, start_time) END,
        end_time = CASE WHEN ${schedule_enabled} = false THEN NULL ELSE COALESCE(${end_time}, end_time) END,
        selected_days = CASE WHEN ${schedule_enabled} = false THEN '{}' ELSE COALESCE(${selected_days}, selected_days) END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      playlist: updated[0],
    })
  } catch (error) {
    console.error("❌ [PLAYLIST API] Error updating playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to update playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Delete a playlist
export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log(`🎵 [PLAYLIST API] Deleting playlist: ${params.playlistId}`)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const db = getDb()

    // Verify ownership and delete
    const deleted = await db`
      DELETE FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING id, name
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST API] Deleted playlist: ${deleted[0].name}`)

    return NextResponse.json({
      success: true,
      message: `Playlist "${deleted[0].name}" deleted successfully`,
    })
  } catch (error) {
    console.error("❌ [PLAYLIST API] Error deleting playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to delete playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
