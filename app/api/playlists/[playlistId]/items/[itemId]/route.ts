import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)
    const { duration, transition_type } = await request.json()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${decoded.userId}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update the item
    const updatedItem = await sql`
      UPDATE playlist_items 
      SET duration = ${duration}, transition_type = ${transition_type}
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (updatedItem.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(updatedItem[0])
  } catch (error) {
    console.error("Error updating playlist item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${decoded.userId}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get the item position before deletion
    const item = await sql`
      SELECT position FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    if (item.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const deletedPosition = item[0].position

    // Delete the item
    await sql`
      DELETE FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
    `

    // Reorder remaining items
    await sql`
      UPDATE playlist_items 
      SET position = position - 1
      WHERE playlist_id = ${playlistId} AND position > ${deletedPosition}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playlist item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
