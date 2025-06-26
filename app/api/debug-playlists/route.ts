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
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'playlists'
      )
    `

    console.log("📋 [DEBUG PLAYLISTS API] Playlists table exists:", tableExists[0].exists)

    if (!tableExists[0].exists) {
      return NextResponse.json({
        error: "Playlists table does not exist",
        suggestion: "Run the playlist setup script",
      })
    }

    // Get table structure
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'playlists'
      ORDER BY ordinal_position
    `

    // Get all playlists for this user
    const playlists = await sql`
      SELECT * FROM playlists WHERE user_id = ${user.id}
    `

    // Get playlist items table structure
    const itemsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'playlist_items'
      )
    `

    let itemsTableStructure = []
    let playlistItems = []

    if (itemsTableExists[0].exists) {
      itemsTableStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'playlist_items'
        ORDER BY ordinal_position
      `

      playlistItems = await sql`
        SELECT pi.*, p.name as playlist_name
        FROM playlist_items pi
        JOIN playlists p ON pi.playlist_id = p.id
        WHERE p.user_id = ${user.id}
      `
    }

    console.log(`✅ [DEBUG PLAYLISTS API] Found ${playlists.length} playlists and ${playlistItems.length} items`)

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email,
        },
        tables: {
          playlists_exists: tableExists[0].exists,
          playlist_items_exists: itemsTableExists[0].exists,
        },
        structure: {
          playlists: tableStructure,
          playlist_items: itemsTableStructure,
        },
        data: {
          playlists: playlists,
          playlist_items: playlistItems,
        },
        counts: {
          playlists: playlists.length,
          playlist_items: playlistItems.length,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLISTS API] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
