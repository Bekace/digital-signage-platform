import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number.parseInt(params.id)

    const result = await query("SELECT * FROM playlists WHERE id = $1", [playlistId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json({ playlist: result.rows[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number.parseInt(params.id)
    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await query(
      "UPDATE playlists SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name.trim(), description?.trim() || "", playlistId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json({ playlist: result.rows[0] })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number.parseInt(params.id)

    // First delete any playlist items
    await query("DELETE FROM playlist_items WHERE playlist_id = $1", [playlistId])

    // Then delete the playlist
    const result = await query("DELETE FROM playlists WHERE id = $1 RETURNING *", [playlistId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 })
  }
}
