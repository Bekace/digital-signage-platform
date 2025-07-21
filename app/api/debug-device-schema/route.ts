import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG DEVICE SCHEMA] Starting schema analysis...")

    // Get detailed schema information for devices table
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        datetime_precision
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `

    // Check for constraints
    const constraints = await sql`
      SELECT 
        constraint_name,
        constraint_type,
        column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'devices'
      ORDER BY constraint_type, constraint_name
    `

    // Check for triggers
    const triggers = await sql`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'devices'
      ORDER BY trigger_name
    `

    // Check indexes
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'devices'
      ORDER BY indexname
    `

    // Get table creation info
    const tableInfo = await sql`
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables 
      WHERE table_name = 'devices'
    `

    console.log("🔍 [DEBUG DEVICE SCHEMA] Found columns:", columns.length)
    console.log("🔍 [DEBUG DEVICE SCHEMA] Found constraints:", constraints.length)
    console.log("🔍 [DEBUG DEVICE SCHEMA] Found triggers:", triggers.length)

    return NextResponse.json({
      success: true,
      data: {
        columns,
        constraints,
        triggers,
        indexes,
        tableInfo,
        analysis: {
          hasUpdatedAtColumn: columns.some((col) => col.column_name === "updated_at"),
          updatedAtDetails: columns.find((col) => col.column_name === "updated_at"),
          totalColumns: columns.length,
          hasConstraints: constraints.length > 0,
          hasTriggers: triggers.length > 0,
        },
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG DEVICE SCHEMA] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze device schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
