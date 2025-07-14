import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG TABLE] Checking table structure for playlists...")

    // Get all columns for playlists table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'playlists'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    console.log("🔍 [DEBUG TABLE] Raw columns result:", columns)
    console.log("🔍 [DEBUG TABLE] Columns length:", columns.length)
    console.log(
      "🔍 [DEBUG TABLE] Column names:",
      columns.map((col) => col.column_name),
    )

    // Check specifically for the missing columns
    const columnNames = columns.map((col) => col.column_name)
    const expectedColumns = [
      "scale_image",
      "scale_video",
      "scale_document",
      "shuffle",
      "default_transition",
      "transition_speed",
      "auto_advance",
      "background_color",
      "text_overlay",
    ]

    const missingColumns = expectedColumns.filter((col) => !columnNames.includes(col))
    const presentColumns = expectedColumns.filter((col) => columnNames.includes(col))

    console.log("🔍 [DEBUG TABLE] Expected columns present:", presentColumns)
    console.log("🔍 [DEBUG TABLE] Missing columns:", missingColumns)

    // Get sample data count
    const sampleData = { count: 0 }
    try {
      const countResult = await sql`SELECT COUNT(*) as count FROM playlists`
      sampleData.count = Number.parseInt(countResult[0].count)

      if (sampleData.count > 0) {
        const samples = await sql`SELECT * FROM playlists LIMIT 2`
        sampleData.samples = samples
        console.log("🔍 [DEBUG TABLE] Sample playlist data:", samples[0])
      }
    } catch (sampleError) {
      console.error("🔍 [DEBUG TABLE] Error getting sample data:", sampleError)
      sampleData.error = sampleError.message
    }

    return NextResponse.json({
      success: true,
      table: "playlists",
      columns: columns,
      columnNames: columnNames,
      totalColumns: columns.length,
      expectedColumns: expectedColumns,
      presentColumns: presentColumns,
      missingColumns: missingColumns,
      sampleData: sampleData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🔍 [DEBUG TABLE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get table structure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
