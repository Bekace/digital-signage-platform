import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.id)
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 })
    }

    const sql = getDb()

    // Update playlist
    const result = await sql`
      UPDATE playlists 
      SET name = ${name}, description = ${description || ""}, updated_at = NOW()
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING id, name, description, status, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      playlist: result[0],
    })
  } catch (error) {
    console.error("Update playlist error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.id)
    const sql = getDb()

    // Delete playlist items first
    await sql`DELETE FROM playlist_items WHERE playlist_id = ${playlistId}`

    // Delete playlist
    const result = await sql`
      DELETE FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Playlist deleted successfully",
    })
  } catch (error) {
    console.error("Delete playlist error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
