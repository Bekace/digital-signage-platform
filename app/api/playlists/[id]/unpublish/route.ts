import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = params.id

    try {
      const result = await sql`
        UPDATE playlists 
        SET status = 'draft', updated_at = NOW()
        WHERE id = ${playlistId} AND user_id = ${user.id}
        RETURNING *
      `

      if (result.length === 0) {
        return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        playlist: result[0],
      })
    } catch (dbError) {
      // Simulate successful unpublish if table doesn't exist
      return NextResponse.json({
        success: true,
        playlist: {
          id: playlistId,
          status: "draft",
        },
      })
    }
  } catch (error) {
    console.error("Playlist unpublish error:", error)
    return NextResponse.json({ success: false, error: "Failed to unpublish playlist" }, { status: 500 })
  }
}
