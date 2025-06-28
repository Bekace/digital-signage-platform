import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    const playlistId = Number.parseInt(params.playlistId)
    const { items } = await request.json()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${decoded.userId}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update positions for all items
    for (let i = 0; i < items.length; i++) {
      await sql`
        UPDATE playlist_items 
        SET position = ${i + 1}
        WHERE id = ${items[i].id} AND playlist_id = ${playlistId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering playlist items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
