import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("🔄 [REORDER API] Unauthorized - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = params.playlistId
    const { items } = await request.json()

    console.log("🔄 [REORDER API] Starting reorder for playlist:", playlistId)
    console.log("🔄 [REORDER API] User ID:", user.id)
    console.log("🔄 [REORDER API] Items to reorder:", items)

    if (!Array.isArray(items)) {
      console.log("🔄 [REORDER API] Invalid items array")
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    const sql = getDb()

    // Verify playlist ownership
    console.log("🔄 [REORDER API] Verifying playlist ownership...")
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("🔄 [REORDER API] Playlist not found or unauthorized")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log("🔄 [REORDER API] Playlist verified, updating positions...")

    // Update positions one by one (avoiding transaction for now)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const newPosition = i + 1

      console.log(`🔄 [REORDER API] Updating item ${item.id} to position ${newPosition}`)

      try {
        await sql`
          UPDATE playlist_items 
          SET position = ${newPosition}
          WHERE id = ${item.id} AND playlist_id = ${playlistId}
        `
        console.log(`🔄 [REORDER API] Successfully updated item ${item.id}`)
      } catch (updateError) {
        console.error(`🔄 [REORDER API] Failed to update item ${item.id}:`, updateError)
        throw updateError
      }
    }

    console.log("🔄 [REORDER API] All positions updated successfully")

    // Return the updated items with their new positions
    console.log("🔄 [REORDER API] Fetching updated items...")
    const updatedItems = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id as media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        mf.id as media_file_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.mime_type,
        mf.dimensions,
        mf.duration as media_duration,
        mf.media_source,
        mf.external_url,
        mf.embed_settings
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    const transformedItems = updatedItems.map((item: any) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_id,
      position: item.position,
      duration: item.duration,
      transition_type: item.transition_type,
      created_at: item.created_at,
      media_file: {
        id: item.media_file_id,
        filename: item.filename,
        original_name: item.original_name,
        file_type: item.file_type,
        file_size: item.file_size,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        mime_type: item.mime_type,
        dimensions: item.dimensions,
        duration: item.media_duration,
        media_source: item.media_source,
        external_url: item.external_url,
        embed_settings: item.embed_settings,
      },
    }))

    console.log("🔄 [REORDER API] Returning updated items:", transformedItems.length)

    return NextResponse.json({
      success: true,
      message: "Playlist items reordered successfully",
      items: transformedItems,
    })
  } catch (error) {
    console.error("🔄 [REORDER API] Error reordering playlist items:", error)
    return NextResponse.json(
      {
        error: "Failed to reorder playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
