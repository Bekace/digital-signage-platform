import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🐛 [DEBUG PLAYLISTS] Starting debug check")

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    user: null,
    database: {
      connected: false,
      tables: {},
      errors: [],
    },
    playlists: {
      count: 0,
      data: [],
      errors: [],
    },
  }

  try {
    // Check user authentication
    try {
      const user = await getCurrentUser()
      debugInfo.user = user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        : null
      console.log("🐛 [DEBUG PLAYLISTS] User check:", debugInfo.user ? "authenticated" : "not authenticated")
    } catch (error) {
      debugInfo.user = { error: error instanceof Error ? error.message : "Unknown error" }
    }

    // Check database connection
    try {
      const sql = getDb()
      const testQuery = await sql`SELECT 1 as test, CURRENT_TIMESTAMP as time`
      debugInfo.database.connected = true
      debugInfo.database.testQuery = testQuery[0]
      console.log("🐛 [DEBUG PLAYLISTS] Database connection: OK")
    } catch (error) {
      debugInfo.database.connected = false
      debugInfo.database.errors.push(error instanceof Error ? error.message : "Unknown error")
      console.log("🐛 [DEBUG PLAYLISTS] Database connection: FAILED")
    }

    if (debugInfo.database.connected) {
      const sql = getDb()

      // Check table existence
      const tables = ["playlists", "playlist_items", "playlist_assignments", "users", "devices"]
      for (const tableName of tables) {
        try {
          const tableCheck = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = ${tableName}
            );
          `
          debugInfo.database.tables[tableName] = {
            exists: tableCheck[0].exists,
          }

          // If table exists, get row count
          if (tableCheck[0].exists) {
            try {
              const countQuery = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`)
              debugInfo.database.tables[tableName].count = Number(countQuery[0].count)
            } catch (error) {
              debugInfo.database.tables[tableName].countError = error instanceof Error ? error.message : "Unknown error"
            }
          }
        } catch (error) {
          debugInfo.database.tables[tableName] = {
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }

      // If user is authenticated and playlists table exists, try to fetch playlists
      if (debugInfo.user && !debugInfo.user.error && debugInfo.database.tables.playlists?.exists) {
        try {
          const playlists = await sql`
            SELECT * FROM playlists 
            WHERE user_id = ${debugInfo.user.id}
            ORDER BY created_at DESC
            LIMIT 5
          `
          debugInfo.playlists.count = playlists.length
          debugInfo.playlists.data = playlists.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            created_at: p.created_at,
          }))
          console.log(`🐛 [DEBUG PLAYLISTS] Found ${playlists.length} playlists`)
        } catch (error) {
          debugInfo.playlists.errors.push(error instanceof Error ? error.message : "Unknown error")
          console.log("🐛 [DEBUG PLAYLISTS] Error fetching playlists:", error)
        }
      }

      // Check database schema for playlists table
      if (debugInfo.database.tables.playlists?.exists) {
        try {
          const schema = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'playlists'
            ORDER BY ordinal_position
          `
          debugInfo.database.tables.playlists.schema = schema
        } catch (error) {
          debugInfo.database.tables.playlists.schemaError = error instanceof Error ? error.message : "Unknown error"
        }
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error("🐛 [DEBUG PLAYLISTS] Unexpected error:", error)
    debugInfo.unexpectedError = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(debugInfo, { status: 500 })
  }
}
