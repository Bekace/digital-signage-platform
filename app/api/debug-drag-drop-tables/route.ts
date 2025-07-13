import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG TABLES] Analyzing table structure...")

    const tables = {
      playlists: { exists: false, columns: [], sample_data: [], row_count: 0 },
      playlist_items: { exists: false, columns: [], sample_data: [], row_count: 0 },
      media_files: { exists: false, columns: [], sample_data: [], row_count: 0 },
    }

    // Check playlists table
    try {
      const playlistColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'playlists' 
        ORDER BY ordinal_position
      `

      const playlistCount = await sql`SELECT COUNT(*) as count FROM playlists`
      const playlistSample = await sql`SELECT * FROM playlists LIMIT 3`

      tables.playlists = {
        exists: true,
        columns: playlistColumns,
        sample_data: playlistSample,
        row_count: Number(playlistCount[0].count),
      }
    } catch (error) {
      console.log("Playlists table does not exist or error:", error)
    }

    // Check playlist_items table
    try {
      const itemColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'playlist_items' 
        ORDER BY ordinal_position
      `

      const itemCount = await sql`SELECT COUNT(*) as count FROM playlist_items`
      const itemSample = await sql`SELECT * FROM playlist_items LIMIT 3`

      tables.playlist_items = {
        exists: true,
        columns: itemColumns,
        sample_data: itemSample,
        row_count: Number(itemCount[0].count),
      }
    } catch (error) {
      console.log("Playlist_items table does not exist or error:", error)
    }

    // Check media_files table
    try {
      const mediaColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'media_files' 
        ORDER BY ordinal_position
      `

      const mediaCount = await sql`SELECT COUNT(*) as count FROM media_files`
      const mediaSample = await sql`SELECT * FROM media_files LIMIT 3`

      tables.media_files = {
        exists: true,
        columns: mediaColumns,
        sample_data: mediaSample,
        row_count: Number(mediaCount[0].count),
      }
    } catch (error) {
      console.log("Media_files table does not exist or error:", error)
    }

    return NextResponse.json({
      success: true,
      tables,
    })
  } catch (error) {
    console.error("🔍 [DEBUG TABLES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze table structure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
