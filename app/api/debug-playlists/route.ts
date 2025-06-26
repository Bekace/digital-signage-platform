import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [DEBUG PLAYLISTS API] Starting debug request")

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check table structures
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
      JOIN playlists p ON pi.playlist_id = p.id
      WHERE p.user_id = ${user.id}
      LIMIT 10
    `

    const mediaFiles = await sql`
      SELECT * FROM media_files WHERE user_id = ${user.id} LIMIT 5
    `

    // Test the problematic query
    let testQueryResult = null
    let testQueryError = null

    try {
      if (playlists.length > 0) {
        const testPlaylistId = playlists[0].id
        testQueryResult = await sql`
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
          WHERE pi.playlist_id = ${testPlaylistId}
          ORDER BY pi.position ASC
        `
      }
    } catch (error) {
      testQueryError = error instanceof Error ? error.message : "Unknown error"
    }

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
        test_query: {
          result: testQueryResult,
          error: testQueryError,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
