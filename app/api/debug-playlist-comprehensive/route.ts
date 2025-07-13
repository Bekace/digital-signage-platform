import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const debugResults = {
    timestamp: new Date().toISOString(),
    authentication: null as any,
    database_connection: null as any,
    table_structure: null as any,
    api_functionality: null as any,
    data_consistency: null as any,
  }

  try {
    // Test 1: Authentication
    console.log("🔍 [DEBUG] Testing authentication...")
    try {
      const user = await getCurrentUser()
      debugResults.authentication = {
        success: !!user,
        user_id: user?.id,
        user_email: user?.email,
        user_data: user,
        error: user ? null : "No authenticated user found",
      }
    } catch (error) {
      debugResults.authentication = {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      }
    }

    // Test 2: Database Connection
    console.log("🔍 [DEBUG] Testing database connection...")
    try {
      const sql = getDb()
      const testQuery = await sql`SELECT 1 as test, NOW() as timestamp`
      debugResults.database_connection = {
        success: true,
        test_result: testQuery[0],
        error: null,
      }
    } catch (error) {
      debugResults.database_connection = {
        success: false,
        error: error instanceof Error ? error.message : "Database connection failed",
      }
    }

    // Test 3: Table Structure Analysis
    console.log("🔍 [DEBUG] Analyzing table structure...")
    if (debugResults.database_connection.success) {
      try {
        const sql = getDb()

        // Check playlists table
        const playlistsColumns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'playlists' 
          ORDER BY ordinal_position
        `

        const playlistsSample = await sql`
          SELECT * FROM playlists 
          ORDER BY created_at DESC 
          LIMIT 3
        `

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
          ORDER BY pi.created_at DESC 
          LIMIT 5
        `

        // Check media table for reference
        const mediaColumns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'media' 
          ORDER BY ordinal_position
        `

        debugResults.table_structure = {
          success: true,
          tables: {
            playlists: {
              exists: playlistsColumns.length > 0,
              columns: playlistsColumns,
              sample_data: playlistsSample,
              row_count: playlistsSample.length,
            },
            playlist_items: {
              exists: playlistItemsColumns.length > 0,
              columns: playlistItemsColumns,
              sample_data: playlistItemsSample,
              row_count: playlistItemsSample.length,
            },
            media: {
              exists: mediaColumns.length > 0,
              columns: mediaColumns,
              column_count: mediaColumns.length,
            },
          },
          column_analysis: {
            playlists_expected_columns: [
              "id",
              "user_id",
              "name",
              "description",
              "status",
              "loop_enabled",
              "schedule_enabled",
              "created_at",
              "updated_at",
            ],
            playlists_actual_columns: playlistsColumns.map((col) => col.column_name),
            playlist_items_expected_columns: ["id", "playlist_id", "media_file_id", "position", "duration"],
            playlist_items_actual_columns: playlistItemsColumns.map((col) => col.column_name),
          },
        }
      } catch (error) {
        debugResults.table_structure = {
          success: false,
          error: error instanceof Error ? error.message : "Table structure analysis failed",
        }
      }
    }

    // Test 4: API Functionality
    console.log("🔍 [DEBUG] Testing API functionality...")
    if (debugResults.authentication.success && debugResults.database_connection.success) {
      try {
        const sql = getDb()
        const user = await getCurrentUser()

        // Test playlist creation
        const testPlaylistName = `Debug Test ${Date.now()}`
        const createResult = await sql`
          INSERT INTO playlists (user_id, name, description, status, loop_enabled, schedule_enabled, created_at, updated_at)
          VALUES (${user!.id}, ${testPlaylistName}, 'Debug test playlist', 'draft', true, false, NOW(), NOW())
          RETURNING *
        `

        // Test playlist retrieval
        const retrieveResult = await sql`
          SELECT 
            p.*,
            COUNT(pi.id) as item_count
          FROM playlists p
          LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
          WHERE p.user_id = ${user!.id}
          GROUP BY p.id
          ORDER BY p.created_at DESC
        `

        // Clean up test playlist
        await sql`DELETE FROM playlists WHERE name = ${testPlaylistName}`

        debugResults.api_functionality = {
          success: true,
          create_test: {
            success: createResult.length > 0,
            created_playlist: createResult[0],
          },
          retrieve_test: {
            success: retrieveResult.length >= 0,
            playlist_count: retrieveResult.length,
            playlists: retrieveResult,
          },
        }
      } catch (error) {
        debugResults.api_functionality = {
          success: false,
          error: error instanceof Error ? error.message : "API functionality test failed",
        }
      }
    }

    // Test 5: Data Consistency
    console.log("🔍 [DEBUG] Checking data consistency...")
    if (debugResults.database_connection.success) {
      try {
        const sql = getDb()

        // Check for orphaned playlist items
        const orphanedItems = await sql`
          SELECT pi.* 
          FROM playlist_items pi
          LEFT JOIN playlists p ON pi.playlist_id = p.id
          WHERE p.id IS NULL
        `

        // Check for playlists without items
        const emptyPlaylists = await sql`
          SELECT p.*, COUNT(pi.id) as item_count
          FROM playlists p
          LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
          GROUP BY p.id
          HAVING COUNT(pi.id) = 0
        `

        // Check for invalid media references
        const invalidMediaRefs = await sql`
          SELECT pi.*, m.id as media_exists
          FROM playlist_items pi
          LEFT JOIN media m ON pi.media_file_id = m.id
          WHERE m.id IS NULL
        `

        debugResults.data_consistency = {
          success: true,
          orphaned_playlist_items: orphanedItems.length,
          empty_playlists: emptyPlaylists.length,
          invalid_media_references: invalidMediaRefs.length,
          details: {
            orphaned_items: orphanedItems,
            empty_playlists: emptyPlaylists,
            invalid_media_refs: invalidMediaRefs,
          },
        }
      } catch (error) {
        debugResults.data_consistency = {
          success: false,
          error: error instanceof Error ? error.message : "Data consistency check failed",
        }
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugResults,
      summary: {
        authentication_working: debugResults.authentication?.success || false,
        database_connected: debugResults.database_connection?.success || false,
        tables_exist: debugResults.table_structure?.success || false,
        api_functional: debugResults.api_functionality?.success || false,
        data_consistent: debugResults.data_consistency?.success || false,
        overall_health:
          debugResults.authentication?.success &&
          debugResults.database_connection?.success &&
          debugResults.table_structure?.success,
      },
    })
  } catch (error) {
    console.error("🔍 [DEBUG] Comprehensive debug failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Debug failed",
        debug: debugResults,
      },
      { status: 500 },
    )
  }
}
