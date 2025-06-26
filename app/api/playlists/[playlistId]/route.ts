import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch a specific playlist with its items
export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
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

    // Fetch playlist details
    const playlistResult = await sql`
      SELECT * FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlistResult.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlistResult[0]

    // Fetch playlist items with media file details
    const items = await sql`
      SELECT 
        pi.*,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.mime_type,
        mf.url,
        mf.thumbnail_url,
        mf.duration as media_duration,
        mf.dimensions
      FROM playlist_items pi
      JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    // Fetch assigned devices
    const assignments = await sql`
      SELECT d.id, d.name, d.status
      FROM playlist_assignments pa
      JOIN devices d ON pa.device_id = d.id
      WHERE pa.playlist_id = ${playlistId}
    `

    return NextResponse.json({
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
        created_at: playlist.created_at,
        updated_at: playlist.updated_at,
      },
      items: items.map((item) => ({
        id: item.id,
        media_file_id: item.media_file_id,
        position: item.position,
        duration: item.duration,
        transition_type: item.transition_type,
        media: {
          filename: item.filename,
          original_name: item.original_name,
          file_type: item.file_type,
          file_size: item.file_size,
          mime_type: item.mime_type,
          url: item.url,
          thumbnail_url: item.thumbnail_url,
          duration: item.media_duration,
          dimensions: item.dimensions,
        },
      })),
      assigned_devices: assignments,
    })
  } catch (error) {
    console.error("Error fetching playlist:", error)
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

    // Verify playlist ownership
    const existingPlaylist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (existingPlaylist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update the playlist
    const updatedPlaylist = await sql`
      UPDATE playlists 
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        status = COALESCE(${status}, status),
        loop_enabled = COALESCE(${loop_enabled}, loop_enabled),
        schedule_enabled = COALESCE(${schedule_enabled}, schedule_enabled),
        start_time = COALESCE(${start_time}, start_time),
        end_time = COALESCE(${end_time}, end_time),
        selected_days = COALESCE(${selected_days}, selected_days),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      playlist: updatedPlaylist[0],
    })
  } catch (error) {
    console.error("Error updating playlist:", error)
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

    // Verify playlist ownership and get details
    const existingPlaylist = await sql`
      SELECT name FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (existingPlaylist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Delete the playlist (cascade will handle items and assignments)
    await sql`
      DELETE FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: `Playlist "${existingPlaylist[0].name}" deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting playlist:", error)
    return NextResponse.json(
      {
        error: "Failed to delete playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
