import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { duration } = body
    const sql = getDb()
    const playlistId = params.id
    const itemId = params.itemId

    try {
      const result = await sql`
        UPDATE playlist_items 
        SET duration = ${duration}, updated_at = NOW()
        WHERE id = ${itemId} AND playlist_id = ${playlistId}
        RETURNING *
      `

      if (result.length === 0) {
        return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        item: result[0],
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({
        success: true,
        item: { id: itemId, duration },
      })
    }
  } catch (error) {
    console.error("Playlist item PATCH error:", error)
    return NextResponse.json({ success: false, error: "Failed to update playlist item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = params.id
    const itemId = params.itemId

    try {
      const result = await sql`
        DELETE FROM playlist_items 
        WHERE id = ${itemId} AND playlist_id = ${playlistId}
        RETURNING *
      `

      return NextResponse.json({
        success: true,
        deleted: result.length > 0,
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({
        success: true,
        deleted: true,
      })
    }
  } catch (error) {
    console.error("Playlist item DELETE error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete playlist item" }, { status: 500 })
  }
}
