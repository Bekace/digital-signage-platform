import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [DEBUG PLAYLISTS] Starting debug request")

  try {
    const user = await getCurrentUser()
    const sql = getDb()

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      tables: {},
      data: {},
      errors: [],
    }

    // Check table existence
    const tables = ["playlists", "playlist_items", "media_files", "users"]
    for (const table of tables) {
      try {
        const exists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          );
        `
        debugInfo.tables[table] = {
          exists: exists[0]?.exists || false,
          columns: [],
        }

        if (exists[0]?.exists) {
          const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = ${table}
            ORDER BY ordinal_position;
          `
          debugInfo.tables[table].columns = columns
        }
      } catch (error) {
        debugInfo.errors.push(`Error checking table ${table}: ${error}`)
      }
    }

    // Get data counts if user is authenticated
    if (user) {
      try {
        if (debugInfo.tables.playlists?.exists) {
          const playlistCount = await sql`
            SELECT COUNT(*) as count FROM playlists WHERE user_id = ${user.id}
          `
          debugInfo.data.playlists = {
            count: Number(playlistCount[0]?.count || 0),
          }

          // Get sample playlists
          const samplePlaylists = await sql`
            SELECT id, name, status, created_at FROM playlists 
            WHERE user_id = ${user.id} 
            ORDER BY created_at DESC 
            LIMIT 5
          `
          debugInfo.data.playlists.samples = samplePlaylists
        }

        if (debugInfo.tables.playlist_items?.exists) {
          const itemCount = await sql`
            SELECT COUNT(*) as count FROM playlist_items pi
            JOIN playlists p ON pi.playlist_id = p.id
            WHERE p.user_id = ${user.id}
          `
          debugInfo.data.playlist_items = {
            count: Number(itemCount[0]?.count || 0),
          }
        }

        if (debugInfo.tables.media_files?.exists) {
          const mediaCount = await sql`
            SELECT COUNT(*) as count FROM media_files WHERE user_id = ${user.id}
          `
          debugInfo.data.media_files = {
            count: Number(mediaCount[0]?.count || 0),
          }
        }
      } catch (error) {
        debugInfo.errors.push(`Error getting data counts: ${error}`)
      }
    }

    console.log("✅ [DEBUG PLAYLISTS] Debug info collected")

    return NextResponse.json(debugInfo, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLISTS] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
