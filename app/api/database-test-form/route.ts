import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

// Ensure test table exists
async function ensureTestTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS database_test_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        test_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("✅ Test table ensured")
  } catch (error) {
    console.error("❌ Error creating test table:", error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("📋 [TEST FORM] Loading test records...")

    // Ensure table exists
    await ensureTestTable()

    // Fetch all records
    const records = await sql`
      SELECT id, name, description, test_data, created_at, updated_at
      FROM database_test_records
      ORDER BY created_at DESC
    `

    console.log("📋 [TEST FORM] Found", records.length, "records")

    return NextResponse.json({
      success: true,
      records: records.map((record) => ({
        id: record.id,
        name: record.name,
        description: record.description,
        test_data: record.test_data,
        created_at: record.created_at,
        updated_at: record.updated_at,
      })),
    })
  } catch (error) {
    console.error("📋 [TEST FORM] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load test records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("➕ [TEST FORM] Creating new test record...")

    const body = await request.json()
    const { name, description, test_data } = body

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    // Ensure table exists
    await ensureTestTable()

    // Insert new record
    const result = await sql`
      INSERT INTO database_test_records (name, description, test_data)
      VALUES (${name.trim()}, ${description || null}, ${test_data || null})
      RETURNING id, name, description, test_data, created_at
    `

    const newRecord = result[0]
    console.log("➕ [TEST FORM] Created record:", newRecord.id)

    return NextResponse.json({
      success: true,
      record: newRecord,
      message: "Test record created successfully",
    })
  } catch (error) {
    console.error("➕ [TEST FORM] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create test record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
