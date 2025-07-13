import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG TABLES] Starting table structure analysis...")

    const tables = {
      playlists: { exists: false, columns: [], sample_data: [], row_count: 0 },
      playlist_items: { exists: false, columns: [], sample_data: [], row_count: 0 },
      media_files: { exists: false, columns: [], sample_data: [], row_count: 0 },
    }

    // Check each table
    for (const tableName of Object.keys(tables)) {
      try {
        console.log(`🔍 [DEBUG TABLES] Checking table: ${tableName}`)

        // Check if table exists and get columns
        const columnsResult = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `

        if (columnsResult.length > 0) {
          tables[tableName].exists = true
          tables[tableName].columns = columnsResult

          // Get row count
          try {
            const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`
            tables[tableName].row_count = Number.parseInt(countResult[0].count)
          } catch (countError) {
            console.error(`Error counting rows in ${tableName}:`, countError)
            tables[tableName].row_count = -1
          }

          // Get sample data (first 3 rows)
          try {
            const sampleResult = await sql`SELECT * FROM ${sql(tableName)} LIMIT 3`
            tables[tableName].sample_data = sampleResult
          } catch (sampleError) {
            console.error(`Error getting sample data from ${tableName}:`, sampleError)
            tables[tableName].sample_data = []
          }

          console.log(`✅ [DEBUG TABLES] Table ${tableName} exists with ${columnsResult.length} columns`)
        } else {
          console.log(`❌ [DEBUG TABLES] Table ${tableName} does not exist`)
        }
      } catch (error) {
        console.error(`Error checking table ${tableName}:`, error)
        tables[tableName].exists = false
      }
    }

    // Additional checks for common table name variations
    const alternativeNames = {
      media_files: ["media", "files", "media_file"],
      playlist_items: ["playlistitems", "playlist_item"],
      playlists: ["playlist"],
    }

    for (const [mainTable, alternatives] of Object.entries(alternativeNames)) {
      if (!tables[mainTable].exists) {
        for (const altName of alternatives) {
          try {
            const altResult = await sql`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns 
              WHERE table_name = ${altName}
              ORDER BY ordinal_position
            `
            if (altResult.length > 0) {
              console.log(`🔍 [DEBUG TABLES] Found alternative table name: ${altName} for ${mainTable}`)
              tables[mainTable].exists = true
              tables[mainTable].columns = altResult
              // Add note about alternative name
              tables[mainTable].alternative_name = altName
              break
            }
          } catch (error) {
            // Ignore errors for alternative names
          }
        }
      }
    }

    console.log("✅ [DEBUG TABLES] Table structure analysis complete")

    return NextResponse.json({
      success: true,
      tables,
      summary: {
        total_tables_checked: Object.keys(tables).length,
        existing_tables: Object.values(tables).filter((t) => t.exists).length,
        missing_tables: Object.values(tables).filter((t) => !t.exists).length,
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG TABLES] Table analysis failed:", error)
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
