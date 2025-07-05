import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.id)
    const sql = getDb()

    // Update playlist status to draft
    const result = await sql`
      UPDATE playlists 
      SET status = 'draft', updated_at = NOW()
      WHERE id = ${playlistId} AND user_id = ${user.id}
      RETURNING id, name, status
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      playlist: result[0],
    })
  } catch (error) {
    console.error("Unpublish playlist error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to unpublish playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
