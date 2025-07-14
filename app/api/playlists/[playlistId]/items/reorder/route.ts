import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string } }) {
  console.log("🔄 [REORDER API] Starting PUT request for playlist:", params.playlistId)

  try {
    // Check authorization header
    const authHeader = request.headers.get("authorization")
    console.log("🔄 [REORDER API] Auth header present:", !!authHeader)
    console.log("🔄 [REORDER API] Auth header format:", authHeader?.startsWith("Bearer ") ? "correct" : "incorrect")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🔄 [REORDER API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          debug: {
            authHeader: !!authHeader,
            authHeaderFormat: authHeader?.startsWith("Bearer ") ? "correct" : "incorrect",
          },
        },
        { status: 401 },
      )
    }

    console.log("🔄 [REORDER API] Authenticated user:", user.id, user.email)

    const playlistId = Number.parseInt(params.playlistId)
    if (isNaN(playlistId)) {
      console.log("🔄 [REORDER API] Invalid playlist ID:", params.playlistId)
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id, name FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      console.log("🔄 [REORDER API] Playlist not found or not owned by user")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log("🔄 [REORDER API] Playlist verified:", playlist[0].name)

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      console.log("🔄 [REORDER API] Invalid items array:", items)
      return NextResponse.json({ error: "Items array is required" }, { status: 400 })
    }

    console.log("🔄 [REORDER API] Reordering", items.length, "items")

    // Validate items format
    for (const item of items) {
      if (!item.id || typeof item.position !== "number") {
        console.log("🔄 [REORDER API] Invalid item format:", item)
        return NextResponse.json({ error: "Each item must have id and position" }, { status: 400 })
      }
    }

    // Update positions in a transaction
    try {
      // Start transaction by updating each item
      const updatePromises = items.map(async (item) => {
        const result = await sql`
          UPDATE playlist_items 
          SET position = ${item.position}, updated_at = NOW()
          WHERE id = ${item.id} 
          AND playlist_id = ${playlistId}
          RETURNING id, position
        `

        if (result.length === 0) {
          throw new Error(`Item ${item.id} not found in playlist ${playlistId}`)
        }

        return result[0]
      })

      const updatedItems = await Promise.all(updatePromises)
      console.log("🔄 [REORDER API] Updated items:", updatedItems.length)

      // Update playlist timestamp
      await sql`
        UPDATE playlists 
        SET updated_at = NOW() 
        WHERE id = ${playlistId}
      `

      // Get the updated playlist items to return
      const finalItems = await sql`
        SELECT 
          pi.id,
          pi.playlist_id,
          pi.media_file_id as media_id,
          pi.position,
          pi.duration,
          pi.transition_type,
          pi.created_at,
          mf.filename,
          mf.original_name,
          mf.file_type,
          mf.url,
          mf.thumbnail_url
        FROM playlist_items pi
        LEFT JOIN media_files mf ON pi.media_file_id = mf.id
        WHERE pi.playlist_id = ${playlistId}
        ORDER BY pi.position ASC
      `

      console.log("🔄 [REORDER API] Reorder completed successfully")

      return NextResponse.json({
        success: true,
        message: "Items reordered successfully",
        items: finalItems,
        updated_count: updatedItems.length,
      })
    } catch (error) {
      console.error("🔄 [REORDER API] Transaction error:", error)
      return NextResponse.json(
        {
          error: "Failed to update item positions",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("🔄 [REORDER API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to reorder playlist items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
