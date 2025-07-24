import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🗺️ [DATABASE STRUCTURE] Fetching database structure...")

    // Get all tables in the public schema
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log(`Found ${tables.length} tables`)

    const tableDetails = []
    let totalColumns = 0
    let totalRows = 0

    for (const table of tables) {
      const tableName = table.table_name

      // Get column information
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position
      `

      // Get row count
      const rowCountResult = await sql`
        SELECT COUNT(*) as count FROM ${sql(tableName)}
      `
      const rowCount = Number.parseInt(rowCountResult[0].count)

      totalColumns += columns.length
      totalRows += rowCount

      tableDetails.push({
        table_name: tableName,
        column_count: columns.length,
        row_count: rowCount,
        columns: columns.map((col) => ({
          column_name: col.column_name,
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default,
        })),
      })

      console.log(`✅ ${tableName}: ${columns.length} columns, ${rowCount} rows`)
    }

    console.log(`📊 Total: ${tables.length} tables, ${totalColumns} columns, ${totalRows} rows`)

    return NextResponse.json({
      success: true,
      tables: tableDetails,
      totalTables: tables.length,
      totalColumns,
      totalRows,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [DATABASE STRUCTURE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch database structure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
