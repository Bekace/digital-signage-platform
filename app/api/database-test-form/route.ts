import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("📋 [DATABASE TEST] Fetching records...")

    const records = await sql`
      SELECT id, name, created_at 
      FROM test_records 
      ORDER BY created_at DESC
    `

    console.log(`✅ [DATABASE TEST] Found ${records.length} records`)

    return NextResponse.json({
      success: true,
      records,
      count: records.length,
    })
  } catch (error) {
    console.error("❌ [DATABASE TEST] Fetch failed:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required and must be a string" }, { status: 400 })
    }

    console.log(`➕ [DATABASE TEST] Creating record with name: ${name}`)

    // Insert new record
    const result = await sql`
      INSERT INTO test_records (name)
      VALUES (${name})
      RETURNING id, name, created_at
    `

    console.log("✅ [DATABASE TEST] Record created successfully!")

    return NextResponse.json({
      success: true,
      message: "Record created successfully",
      record: result[0],
    })
  } catch (error) {
    console.error("❌ [DATABASE TEST] Create failed:", error)

    return NextResponse.json(
      {
        error: "Failed to create record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
