import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("✏️ [PLAYLIST ITEM API] Starting PUT request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEM API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("📝 [PLAYLIST ITEM API] Update body:", body)

    const { duration } = body

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Update playlist item
    const updatedItem = await sql`
      UPDATE playlist_items 
      SET 
        duration = COALESCE(${duration}, duration)
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (updatedItem.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST ITEM API] Updated item: ${itemId}`)

    // Get the full item with media details
    const fullItem = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_id,
        pi.position,
        pi.duration,
        pi.created_at,
        mf.id as media_file_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.metadata
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.id = ${itemId}
    `

    const item = fullItem[0]

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        playlist_id: item.playlist_id,
        media_id: item.media_id,
        position: item.position,
        duration: item.duration,
        created_at: item.created_at,
        media: {
          id: item.media_file_id,
          filename: item.filename,
          original_filename: item.original_name,
          file_type: item.file_type,
          file_size: item.file_size,
          url: item.url,
          thumbnail_url: item.thumbnail_url,
          metadata: item.metadata,
        },
      },
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update playlist item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { playlistId: string; itemId: string } }) {
  console.log("🗑️ [PLAYLIST ITEM API] Starting DELETE request for item:", params.itemId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [PLAYLIST ITEM API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = Number.parseInt(params.playlistId)
    const itemId = Number.parseInt(params.itemId)

    if (isNaN(playlistId) || isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid playlist or item ID" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("❌ [PLAYLIST ITEM API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Delete playlist item
    const deletedItem = await sql`
      DELETE FROM playlist_items 
      WHERE id = ${itemId} AND playlist_id = ${playlistId}
      RETURNING *
    `

    if (deletedItem.length === 0) {
      return NextResponse.json({ error: "Playlist item not found" }, { status: 404 })
    }

    console.log(`✅ [PLAYLIST ITEM API] Deleted item: ${itemId}`)

    return NextResponse.json({
      success: true,
      message: "Playlist item deleted successfully",
    })
  } catch (error) {
    console.error("❌ [PLAYLIST ITEM API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete playlist item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
