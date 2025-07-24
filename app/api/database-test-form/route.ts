import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Ensure test table exists
    await sql`
      CREATE TABLE IF NOT EXISTS test_records (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Get all records
    const records = await sql`
      SELECT id, name, email, created_at
      FROM test_records
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      records: records,
      count: records.length,
    })
  } catch (error) {
    console.error("❌ Error fetching test records:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch test records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const sql = getDb()

    // Ensure test table exists
    await sql`
      CREATE TABLE IF NOT EXISTS test_records (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insert new record
    const result = await sql`
      INSERT INTO test_records (name, email)
      VALUES (${name}, ${email})
      RETURNING id, name, email, created_at
    `

    return NextResponse.json({
      success: true,
      message: "Record created successfully",
      record: result[0],
    })
  } catch (error) {
    console.error("❌ Error creating test record:", error)
    return NextResponse.json(
      {
        error: "Failed to create test record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
