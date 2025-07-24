import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    console.log("🔍 Fetching database structure...")

    // Get table structure
    const structure = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    // Get table row counts
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `

    const stats = []
    for (const table of tables) {
      try {
        const result = await sql`
          SELECT COUNT(*) as count
          FROM ${sql(table.table_name)}
        `
        stats.push({
          table_name: table.table_name,
          row_count: Number.parseInt(result[0].count),
        })
      } catch (error) {
        console.warn(`Could not get count for table ${table.table_name}:`, error)
        stats.push({
          table_name: table.table_name,
          row_count: 0,
        })
      }
    }

    // Group structure by table
    const groupedStructure = structure.reduce((acc, row) => {
      if (!acc[row.table_name]) {
        acc[row.table_name] = []
      }
      acc[row.table_name].push(row)
      return acc
    }, {})

    console.log(`✅ Found ${Object.keys(groupedStructure).length} tables`)

    return NextResponse.json({
      success: true,
      structure: groupedStructure,
      stats: stats,
      summary: {
        totalTables: Object.keys(groupedStructure).length,
        tablesWithData: stats.filter((s) => s.row_count > 0).length,
        totalRecords: stats.reduce((sum, s) => sum + s.row_count, 0),
      },
    })
  } catch (error) {
    console.error("❌ Error fetching database structure:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch database structure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
