import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [DEBUG PLAYLISTS API] Starting debug request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ [DEBUG PLAYLISTS API] No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if playlists table exists
    const playlistsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'playlists'
      ) as exists
    `

    // Check if playlist_items table exists
    const playlistItemsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'playlist_items'
      ) as exists
    `

    // Get playlists table structure
    let playlistsColumns = []
    if (playlistsTableExists[0].exists) {
      playlistsColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'playlists'
        ORDER BY ordinal_position
      `
    }

    // Get playlist_items table structure
    let playlistItemsColumns = []
    if (playlistItemsTableExists[0].exists) {
      playlistItemsColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'playlist_items'
        ORDER BY ordinal_position
      `
    }

    // Get sample data
    let samplePlaylists = []
    let samplePlaylistItems = []

    if (playlistsTableExists[0].exists) {
      try {
        samplePlaylists = await sql`
          SELECT * FROM playlists WHERE user_id = ${user.id} LIMIT 3
        `
      } catch (error) {
        console.error("Error fetching sample playlists:", error)
      }
    }

    if (playlistItemsTableExists[0].exists) {
      try {
        samplePlaylistItems = await sql`
          SELECT pi.*, p.name as playlist_name 
          FROM playlist_items pi
          LEFT JOIN playlists p ON pi.playlist_id = p.id
          WHERE p.user_id = ${user.id}
          LIMIT 5
        `
      } catch (error) {
        console.error("Error fetching sample playlist items:", error)
      }
    }

    // Check for required columns
    const requiredPlaylistColumns = [
      "id",
      "user_id",
      "name",
      "description",
      "status",
      "created_at",
      "updated_at",
      "scale_image",
      "scale_video",
      "scale_document",
      "shuffle",
      "default_transition",
      "transition_speed",
      "auto_advance",
      "background_color",
      "text_overlay",
      "loop_enabled",
      "schedule_enabled",
      "start_time",
      "end_time",
      "selected_days",
    ]

    const requiredPlaylistItemColumns = ["id", "playlist_id", "media_id", "position", "duration", "created_at"]

    const existingPlaylistColumns = playlistsColumns.map((col) => col.column_name)
    const existingPlaylistItemColumns = playlistItemsColumns.map((col) => col.column_name)

    const missingPlaylistColumns = requiredPlaylistColumns.filter((col) => !existingPlaylistColumns.includes(col))
    const missingPlaylistItemColumns = requiredPlaylistItemColumns.filter(
      (col) => !existingPlaylistItemColumns.includes(col),
    )

    console.log(`✅ [DEBUG PLAYLISTS API] Debug info compiled for user ${user.id}`)

    return NextResponse.json({
      success: true,
      debug: {
        user_id: user.id,
        tables: {
          playlists: {
            exists: playlistsTableExists[0].exists,
            columns: playlistsColumns,
            missing_columns: missingPlaylistColumns,
            sample_data: samplePlaylists,
          },
          playlist_items: {
            exists: playlistItemsTableExists[0].exists,
            columns: playlistItemsColumns,
            missing_columns: missingPlaylistItemColumns,
            sample_data: samplePlaylistItems,
          },
        },
        summary: {
          playlists_table_ready: playlistsTableExists[0].exists && missingPlaylistColumns.length === 0,
          playlist_items_table_ready: playlistItemsTableExists[0].exists && missingPlaylistItemColumns.length === 0,
          total_playlists: samplePlaylists.length,
          total_playlist_items: samplePlaylistItems.length,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to get debug info",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
