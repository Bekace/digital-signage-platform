import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [DEBUG PLAYLISTS] Starting debug request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check table structure
    const playlistsTableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'playlists'
      ORDER BY ordinal_position
    `

    const playlistItemsTableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'playlist_items'
      ORDER BY ordinal_position
    `

    const mediaFilesTableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'media_files'
      ORDER BY ordinal_position
    `

    // Get sample data
    const playlists = await sql`
      SELECT * FROM playlists WHERE user_id = ${user.id} LIMIT 5
    `

    const playlistItems = await sql`
      SELECT pi.*, p.name as playlist_name 
      FROM playlist_items pi
      LEFT JOIN playlists p ON pi.playlist_id = p.id
      WHERE p.user_id = ${user.id}
      LIMIT 10
    `

    const mediaFiles = await sql`
      SELECT * FROM media_files WHERE user_id = ${user.id} LIMIT 5
    `

    return NextResponse.json({
      success: true,
      debug_info: {
        user_id: user.id,
        tables: {
          playlists: {
            structure: playlistsTableInfo,
            sample_data: playlists,
            count: playlists.length,
          },
          playlist_items: {
            structure: playlistItemsTableInfo,
            sample_data: playlistItems,
            count: playlistItems.length,
          },
          media_files: {
            structure: mediaFilesTableInfo,
            sample_data: mediaFiles,
            count: mediaFiles.length,
          },
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLISTS] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
