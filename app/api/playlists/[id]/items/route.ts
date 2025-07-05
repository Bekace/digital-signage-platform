import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.id)
    const sql = getDb()

    // Check if playlist belongs to user
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    // Get playlist items (for now return empty array since we don't have media items yet)
    const items = []

    return NextResponse.json({
      success: true,
      items: items,
    })
  } catch (error) {
    console.error("Get playlist items error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
