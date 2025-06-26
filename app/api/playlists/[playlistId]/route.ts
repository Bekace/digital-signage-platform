import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = params.playlistId

    // Get playlist details
    const playlists = await sql`
      SELECT * FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlists[0]

    // Get playlist stats
    const stats = await sql`
      SELECT 
        COUNT(*) as item_count,
        COALESCE(SUM(mf.file_size), 0) as total_size,
        COALESCE(SUM(pi.duration), 0) as total_duration
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
    `

    return NextResponse.json({
      playlist: {
        ...playlist,
        item_count: Number.parseInt(stats[0].item_count),
        total_size: Number.parseInt(stats[0].total_size),
        total_duration: Number.parseInt(stats[0].total_duration),
      },
    })
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const sql = getDb()
    const playlistId = params.playlistId

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update playlist
    const result = await sql`
      UPDATE playlists 
      SET 
        name = COALESCE(${updates.name}, name),
        description = COALESCE(${updates.description}, description),
        settings = COALESCE(${JSON.stringify(updates.settings)}, settings),
        updated_at = NOW()
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({ playlist: result[0] })
  } catch (error) {
    console.error("Error updating playlist:", error)
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = params.playlistId

    // Verify playlist ownership
    const playlists = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlists.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Delete playlist items first
    await sql`
      DELETE FROM playlist_items WHERE playlist_id = ${playlistId}
    `

    // Delete playlist
    await sql`
      DELETE FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playlist:", error)
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 })
  }
}
