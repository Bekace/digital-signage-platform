import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Test connection
    let connectionStatus = "connected"
    try {
      await sql`SELECT 1`
    } catch (error) {
      connectionStatus = "error"
      return NextResponse.json({
        error: "Database connection failed",
        connectionStatus,
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Get all table information with columns, data types, and constraints
    const tableInfo = await sql`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        fk.foreign_table_name as foreign_key_table,
        fk.foreign_column_name as foreign_key_column
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN (
        SELECT 
          kcu.table_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
        SELECT 
          kcu.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.column_name IS NOT NULL
      ORDER BY t.table_name, c.ordinal_position
    `

    // Group by table
    const tablesMap = new Map()
    for (const row of tableInfo) {
      if (!tablesMap.has(row.table_name)) {
        tablesMap.set(row.table_name, {
          name: row.table_name,
          columns: [],
          rowCount: 0,
        })
      }
      tablesMap.get(row.table_name).columns.push({
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default,
        is_primary_key: row.is_primary_key,
        foreign_key_table: row.foreign_key_table,
        foreign_key_column: row.foreign_key_column,
      })
    }

    // Get row counts for each table
    const tables = Array.from(tablesMap.values())
    for (const table of tables) {
      try {
        const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${table.name}`)
        table.rowCount = Number.parseInt(countResult[0].count)
      } catch (error) {
        console.warn(`Could not get row count for table ${table.name}:`, error)
        table.rowCount = 0
      }
    }

    return NextResponse.json({
      success: true,
      connectionStatus,
      tables: tables.sort((a, b) => a.name.localeCompare(b.name)),
      summary: {
        totalTables: tables.length,
        totalColumns: tables.reduce((sum, table) => sum + table.columns.length, 0),
        tablesWithData: tables.filter((table) => table.rowCount > 0).length,
        foreignKeys: tables.reduce(
          (sum, table) => sum + table.columns.filter((col) => col.foreign_key_table).length,
          0,
        ),
      },
    })
  } catch (error) {
    console.error("❌ Error fetching database structure:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch database structure",
        connectionStatus: "error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
