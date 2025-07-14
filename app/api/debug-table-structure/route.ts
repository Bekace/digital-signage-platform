import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG TABLE] Checking database table structure...")

    const results = {
      tables: {},
      sampleData: {},
      errors: [],
      timestamp: new Date().toISOString(),
    }

    // Check if tables exist and get their columns
    const tablesToCheck = ["users", "playlists", "media_files", "playlist_items", "devices"]

    for (const tableName of tablesToCheck) {
      try {
        // Check if table exists
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          )
        `

        if (tableExists[0].exists) {
          // Get column information
          const columns = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = ${tableName}
            AND table_schema = 'public'
            ORDER BY ordinal_position
          `

          results.tables[tableName] = {
            exists: true,
            columns: columns.map((col) => col.column_name),
            columnDetails: columns,
          }

          // Get sample data count
          try {
            const count = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`)
            results.sampleData[tableName] = {
              count: Number.parseInt(count[0].count),
            }

            // Get a few sample records if they exist
            if (Number.parseInt(count[0].count) > 0) {
              const samples = await sql.unsafe(`SELECT * FROM ${tableName} LIMIT 3`)
              results.sampleData[tableName].samples = samples
            }
          } catch (sampleError) {
            results.sampleData[tableName] = {
              count: 0,
              error: sampleError.message,
            }
          }
        } else {
          results.tables[tableName] = {
            exists: false,
            columns: [],
            columnDetails: [],
          }
        }
      } catch (error) {
        results.errors.push({
          table: tableName,
          error: error.message,
        })
        results.tables[tableName] = {
          exists: false,
          columns: [],
          columnDetails: [],
          error: error.message,
        }
      }
    }

    // Additional database info
    try {
      const dbInfo = await sql`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as version
      `
      results.databaseInfo = dbInfo[0]
    } catch (error) {
      results.errors.push({
        section: "database_info",
        error: error.message,
      })
    }

    console.log("🔍 [DEBUG TABLE] Table structure check completed")

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error("🔍 [DEBUG TABLE] Error checking table structure:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check table structure",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
