import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🗺️ [DATABASE MAP] Starting database structure analysis...")

    // Test database connection
    try {
      await sql`SELECT 1`
      console.log("🗺️ [DATABASE MAP] Database connection successful")
    } catch (dbError) {
      console.error("🗺️ [DATABASE MAP] Database connection failed:", dbError)
      return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 })
    }

    // Get all tables in the public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log(
      "🗺️ [DATABASE MAP] Found tables:",
      tables.map((t) => t.table_name),
    )

    // Get detailed information for each table
    const tableDetails = []

    for (const table of tables) {
      const tableName = table.table_name

      try {
        // Get column information
        const columns = await sql`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          ORDER BY ordinal_position
        `

        // Get row count
        const countResult = await sql`
          SELECT COUNT(*) as count 
          FROM ${sql(tableName)}
        `
        const rowCount = Number.parseInt(countResult[0].count)

        tableDetails.push({
          table_name: tableName,
          column_count: columns.length,
          row_count: rowCount,
          columns: columns,
        })

        console.log(`🗺️ [DATABASE MAP] Table ${tableName}: ${columns.length} columns, ${rowCount} rows`)
      } catch (error) {
        console.error(`🗺️ [DATABASE MAP] Error analyzing table ${tableName}:`, error)

        // Add table with error info
        tableDetails.push({
          table_name: tableName,
          column_count: 0,
          row_count: 0,
          columns: [],
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Get foreign key relationships
    const relationships = await sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `

    console.log("🗺️ [DATABASE MAP] Found relationships:", relationships.length)

    const structure = {
      tables: tableDetails,
      relationships: relationships.map((rel) => ({
        table: rel.table_name,
        column: rel.column_name,
        referenced_table: rel.referenced_table,
        referenced_column: rel.referenced_column,
      })),
    }

    console.log("🗺️ [DATABASE MAP] Analysis complete")

    return NextResponse.json({
      success: true,
      structure,
      summary: {
        total_tables: tableDetails.length,
        total_rows: tableDetails.reduce((sum, table) => sum + table.row_count, 0),
        empty_tables: tableDetails.filter((table) => table.row_count === 0).length,
        populated_tables: tableDetails.filter((table) => table.row_count > 0).length,
        total_relationships: relationships.length,
      },
    })
  } catch (error) {
    console.error("🗺️ [DATABASE MAP] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze database structure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
