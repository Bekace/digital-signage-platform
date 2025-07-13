import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting comprehensive playlist diagnostic...")

    const results = {
      timestamp: new Date().toISOString(),
      authentication: { success: false, user_id: null, error: null },
      database_connection: { success: false, error: null },
      table_structure: {
        playlists: { exists: false, columns: [], sample_data: [] },
        playlist_items: { exists: false, columns: [], sample_data: [] },
      },
      data_consistency: {
        total_playlists: 0,
        total_playlist_items: 0,
        orphaned_items: 0,
        playlists_with_items: 0,
      },
      api_functionality: {
        can_create_playlist: false,
        can_fetch_playlists: false,
        can_fetch_single_playlist: false,
        errors: [],
      },
    }

    // Test 1: Authentication
    try {
      const user = await getCurrentUser()
      if (user) {
        results.authentication = {
          success: true,
          user_id: user.id,
          error: null,
        }
        console.log("✅ [DEBUG] Authentication successful, user ID:", user.id)
      } else {
        results.authentication = {
          success: false,
          user_id: null,
          error: "No authenticated user found",
        }
        console.log("❌ [DEBUG] Authentication failed")
      }
    } catch (error) {
      results.authentication = {
        success: false,
        user_id: null,
        error: error instanceof Error ? error.message : "Authentication error",
      }
      console.error("❌ [DEBUG] Authentication error:", error)
    }

    // Test 2: Database Connection
    try {
      const sql = getDb()
      await sql`SELECT 1 as test`
      results.database_connection = { success: true, error: null }
      console.log("✅ [DEBUG] Database connection successful")
    } catch (error) {
      results.database_connection = {
        success: false,
        error: error instanceof Error ? error.message : "Database connection failed",
      }
      console.error("❌ [DEBUG] Database connection error:", error)
      return NextResponse.json({ success: false, error: "Database connection failed", results })
    }

    const sql = getDb()

    // Test 3: Table Structure Analysis
    try {
      // Check playlists table
      const playlistsColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'playlists'
        ORDER BY ordinal_position
      `

      const playlistsSample = await sql`
        SELECT * FROM playlists LIMIT 3
      `

      results.table_structure.playlists = {
        exists: playlistsColumns.length > 0,
        columns: playlistsColumns,
        sample_data: playlistsSample,
      }

      // Check playlist_items table
      const playlistItemsColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'playlist_items'
        ORDER BY ordinal_position
      `

      const playlistItemsSample = await sql`
        SELECT pi.*, p.name as playlist_name 
        FROM playlist_items pi
        LEFT JOIN playlists p ON pi.playlist_id = p.id
        LIMIT 5
      `

      results.table_structure.playlist_items = {
        exists: playlistItemsColumns.length > 0,
        columns: playlistItemsColumns,
        sample_data: playlistItemsSample,
      }

      console.log("✅ [DEBUG] Table structure analysis complete")
    } catch (error) {
      console.error("❌ [DEBUG] Table structure analysis error:", error)
      results.api_functionality.errors.push(
        `Table structure error: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }

    // Test 4: Data Consistency Check
    if (results.authentication.success && results.authentication.user_id) {
      try {
        const userId = results.authentication.user_id

        // Count total playlists for user
        const totalPlaylists = await sql`
          SELECT COUNT(*) as count FROM playlists WHERE user_id = ${userId}
        `
        results.data_consistency.total_playlists = Number(totalPlaylists[0].count)

        // Count total playlist items for user's playlists
        const totalItems = await sql`
          SELECT COUNT(pi.*) as count 
          FROM playlist_items pi
          JOIN playlists p ON pi.playlist_id = p.id
          WHERE p.user_id = ${userId}
        `
        results.data_consistency.total_playlist_items = Number(totalItems[0].count)

        // Check for orphaned playlist items
        const orphanedItems = await sql`
          SELECT COUNT(*) as count 
          FROM playlist_items pi
          LEFT JOIN playlists p ON pi.playlist_id = p.id
          WHERE p.id IS NULL
        `
        results.data_consistency.orphaned_items = Number(orphanedItems[0].count)

        // Count playlists with items
        const playlistsWithItems = await sql`
          SELECT COUNT(DISTINCT p.id) as count
          FROM playlists p
          JOIN playlist_items pi ON p.id = pi.playlist_id
          WHERE p.user_id = ${userId}
        `
        results.data_consistency.playlists_with_items = Number(playlistsWithItems[0].count)

        console.log("✅ [DEBUG] Data consistency check complete")
      } catch (error) {
        console.error("❌ [DEBUG] Data consistency check error:", error)
        results.api_functionality.errors.push(
          `Data consistency error: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }

    // Test 5: API Functionality Tests
    if (results.authentication.success && results.authentication.user_id) {
      try {
        const userId = results.authentication.user_id

        // Test fetching playlists
        try {
          const playlists = await sql`
            SELECT 
              p.id,
              p.name,
              p.description,
              p.status,
              p.loop_enabled,
              p.schedule_enabled,
              p.start_time,
              p.end_time,
              p.selected_days,
              p.created_at,
              p.updated_at,
              COUNT(pi.id) as item_count,
              COALESCE(SUM(pi.duration), 0) as total_duration
            FROM playlists p
            LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
            WHERE p.user_id = ${userId}
            GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled, 
                     p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
            ORDER BY p.created_at DESC
          `
          results.api_functionality.can_fetch_playlists = true
          console.log("✅ [DEBUG] Can fetch playlists:", playlists.length)
        } catch (error) {
          results.api_functionality.can_fetch_playlists = false
          results.api_functionality.errors.push(
            `Fetch playlists error: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
          console.error("❌ [DEBUG] Cannot fetch playlists:", error)
        }

        // Test creating playlist
        try {
          const testPlaylist = await sql`
            INSERT INTO playlists (
              user_id, 
              name, 
              description, 
              status, 
              loop_enabled, 
              schedule_enabled, 
              created_at, 
              updated_at
            )
            VALUES (
              ${userId}, 
              'Debug Test Playlist', 
              'Created by debug tool', 
              'draft', 
              true, 
              false, 
              NOW(), 
              NOW()
            )
            RETURNING id, name
          `
          results.api_functionality.can_create_playlist = true
          console.log("✅ [DEBUG] Can create playlist:", testPlaylist[0].id)

          // Test fetching single playlist
          try {
            const singlePlaylist = await sql`
              SELECT 
                p.id,
                p.name,
                p.description,
                p.status,
                p.loop_enabled,
                p.schedule_enabled,
                p.start_time,
                p.end_time,
                p.selected_days,
                p.created_at,
                p.updated_at,
                COUNT(pi.id) as item_count,
                COALESCE(SUM(pi.duration), 0) as total_duration
              FROM playlists p
              LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
              WHERE p.id = ${testPlaylist[0].id} AND p.user_id = ${userId}
              GROUP BY p.id, p.name, p.description, p.status, p.loop_enabled, p.schedule_enabled,
                       p.start_time, p.end_time, p.selected_days, p.created_at, p.updated_at
            `
            results.api_functionality.can_fetch_single_playlist = singlePlaylist.length > 0
            console.log("✅ [DEBUG] Can fetch single playlist")

            // Clean up test playlist
            await sql`DELETE FROM playlists WHERE id = ${testPlaylist[0].id}`
          } catch (error) {
            results.api_functionality.can_fetch_single_playlist = false
            results.api_functionality.errors.push(
              `Fetch single playlist error: ${error instanceof Error ? error.message : "Unknown error"}`,
            )
            console.error("❌ [DEBUG] Cannot fetch single playlist:", error)
          }
        } catch (error) {
          results.api_functionality.can_create_playlist = false
          results.api_functionality.errors.push(
            `Create playlist error: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
          console.error("❌ [DEBUG] Cannot create playlist:", error)
        }
      } catch (error) {
        console.error("❌ [DEBUG] API functionality test error:", error)
        results.api_functionality.errors.push(
          `API functionality error: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }

    console.log("🔍 [DEBUG] Comprehensive diagnostic complete")

    return NextResponse.json({
      success: true,
      debug: results,
    })
  } catch (error) {
    console.error("❌ [DEBUG] Comprehensive diagnostic failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
