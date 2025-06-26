import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch a specific playlist with its items
export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
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

    const sql = getDb()

    // Get playlist details
    const playlist = await sql`
      SELECT * FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items
    const items = await sql`
      SELECT 
        pi.*,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.duration as media_duration,
        mf.url
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    // Get device assignments
    const assignments = await sql`
      SELECT 
        pa.*,
        d.name as device_name,
        d.status as device_status
      FROM playlist_assignments pa
      LEFT JOIN devices d ON pa.device_id = d.id
      WHERE pa.playlist_id = ${playlistId}
      ORDER BY pa.priority ASC
    `

    const playlistData = {
      ...playlist[0],
      selected_days: playlist[0].selected_days || [],
      items: items.map((item) => ({
        id: item.id,
        media_file_id: item.media_file_id,
        position: item.position,
        duration: item.duration,
        transition_type: item.transition_type,
        media: item.media_file_id
          ? {
              filename: item.filename,
              original_name: item.original_name,
              file_type: item.file_type,
              file_size: item.file_size,
              duration: item.media_duration,
              url: item.url,
            }
          : null,
      })),
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        device_id: assignment.device_id,
        device_name: assignment.device_name,
        device_status: assignment.device_status,
        priority: assignment.priority,
      })),
    }

    return NextResponse.json({
      success: true,
      playlist: playlistData,
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
export async function PUT(request: Request, { params }: { params: { playlistId: string } }) {
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

    const sql = getDb()

    // Verify ownership
    const existing = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update playlist
    const updated = await sql`
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
export async function DELETE(request: Request, { params }: { params: { playlistId: string } }) {
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

    const sql = getDb()

    // Verify ownership and delete
    const deleted = await sql`
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
