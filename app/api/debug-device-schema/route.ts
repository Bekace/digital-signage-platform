import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG DEVICE SCHEMA] Starting schema analysis...")

    // Get devices table columns
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'devices'
      ORDER BY ordinal_position
    `

    // Get table constraints
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'devices'
      ORDER BY tc.constraint_type, tc.constraint_name
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

    // Get table indexes
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'devices'
      ORDER BY indexname
    `

    // Analyze updated_at column specifically
    const updatedAtColumn = columns.find((col) => col.column_name === "updated_at")

    // Check if there are any rules on the table
    const rules = await sql`
      SELECT 
        rulename,
        definition
      FROM pg_rules 
      WHERE tablename = 'devices'
    `

    // Get table owner and permissions
    const tableInfo = await sql`
      SELECT 
        t.table_name,
        t.table_type,
        t.table_schema,
        c.relowner::regrole as table_owner
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_name = 'devices'
      AND t.table_schema = 'public'
    `

    const analysis = {
      hasUpdatedAtColumn: !!updatedAtColumn,
      totalColumns: columns.length,
      hasConstraints: constraints.length > 0,
      hasTriggers: triggers.length > 0,
      hasIndexes: indexes.length > 0,
      hasRules: rules.length > 0,
      updatedAtDetails: updatedAtColumn,
      constraintTypes: [...new Set(constraints.map((c) => c.constraint_type))],
      triggerCount: triggers.length,
      indexCount: indexes.length,
    }

    console.log("🔍 [DEBUG DEVICE SCHEMA] Analysis complete:", {
      columns: columns.length,
      constraints: constraints.length,
      triggers: triggers.length,
      hasUpdatedAt: analysis.hasUpdatedAtColumn,
    })

    return NextResponse.json({
      success: true,
      data: {
        columns,
        constraints,
        triggers,
        indexes,
        rules,
        tableInfo,
        analysis,
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
