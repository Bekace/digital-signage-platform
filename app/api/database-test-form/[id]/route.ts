import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    console.log(`🗑️ [DELETE TEST RECORD] Deleting record ID: ${id}`)

    // Delete the record
    const result = await sql`
      DELETE FROM database_test_records 
      WHERE id = ${id}
      RETURNING id, name, description
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    console.log(`✅ [DELETE TEST RECORD] Deleted record: ${result[0].name}`)

    return NextResponse.json({
      success: true,
      message: "Record deleted successfully",
      deletedRecord: result[0],
    })
  } catch (error) {
    console.error("❌ [DELETE TEST RECORD] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const { name, description, test_data } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    console.log(`✏️ [UPDATE TEST RECORD] Updating record ID: ${id}`)

    // Update the record
    const result = await sql`
      UPDATE database_test_records 
      SET 
        name = ${name.trim()},
        description = ${description || null},
        test_data = ${test_data || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, description, test_data, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    console.log(`✅ [UPDATE TEST RECORD] Updated record: ${result[0].name}`)

    return NextResponse.json({
      success: true,
      message: "Record updated successfully",
      record: result[0],
    })
  } catch (error) {
    console.error("❌ [UPDATE TEST RECORD] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
