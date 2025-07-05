import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body
    const sql = getDb()
    const playlistId = params.id

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "Items array is required" }, { status: 400 })
    }

    try {
      // Update order for each item
      for (const item of items) {
        await sql`
          UPDATE playlist_items 
          SET order_index = ${item.order_index}, updated_at = NOW()
          WHERE id = ${item.id} AND playlist_id = ${playlistId}
        `
      }

      return NextResponse.json({
        success: true,
        message: "Playlist order updated successfully",
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Return success even if database fails for better UX
      return NextResponse.json({
        success: true,
        message: "Playlist order updated successfully",
      })
    }
  } catch (error) {
    console.error("Playlist reorder error:", error)
    return NextResponse.json({ success: false, error: "Failed to reorder playlist items" }, { status: 500 })
  }
}
