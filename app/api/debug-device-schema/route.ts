import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG DEVICE SCHEMA] Starting schema analysis...")

    // Get column information
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
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    // Get constraints
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'devices'
      AND tc.table_schema = 'public'
    `

    // Get triggers
    const triggers = await sql`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'devices'
      AND event_object_schema = 'public'
    `

    // Get indexes
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'devices'
      AND schemaname = 'public'
    `

    // Get rules
    const rules = await sql`
      SELECT 
        rulename,
        definition
      FROM pg_rules
      WHERE tablename = 'devices'
      AND schemaname = 'public'
    `

    // Get table info
    const tableInfo = await sql`
      SELECT 
        table_name,
        table_type,
        table_schema,
        table_owner
      FROM information_schema.tables
      WHERE table_name = 'devices'
      AND table_schema = 'public'
    `

    // Analysis
    const updatedAtColumn = columns.find((col) => col.column_name === "updated_at")
    const hasUpdatedAtColumn = !!updatedAtColumn
    const totalColumns = columns.length
    const hasConstraints = constraints.length > 0
    const hasTriggers = triggers.length > 0
    const hasIndexes = indexes.length > 0
    const hasRules = rules.length > 0

    const constraintTypes = [...new Set(constraints.map((c) => c.constraint_type))]

    console.log("🔍 [DEBUG DEVICE SCHEMA] Analysis complete:", {
      hasUpdatedAtColumn,
      totalColumns,
      hasConstraints,
      hasTriggers,
      triggerCount: triggers.length,
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
        analysis: {
          hasUpdatedAtColumn,
          totalColumns,
          hasConstraints,
          hasTriggers,
          hasIndexes,
          hasRules,
          updatedAtDetails: updatedAtColumn,
          constraintTypes,
          triggerCount: triggers.length,
          indexCount: indexes.length,
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
