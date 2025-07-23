import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log("✏️ [TEST FORM] Updating record:", id)

    const body = await request.json()
    const { name, description, test_data } = body

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    // Update record
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
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 })
    }

    const updatedRecord = result[0]
    console.log("✏️ [TEST FORM] Updated record:", updatedRecord.id)

    return NextResponse.json({
      success: true,
      record: updatedRecord,
      message: "Test record updated successfully",
    })
  } catch (error) {
    console.error("✏️ [TEST FORM] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update test record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log("🗑️ [TEST FORM] Deleting record:", id)

    // Delete record
    const result = await sql`
      DELETE FROM database_test_records 
      WHERE id = ${id}
      RETURNING id, name
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 })
    }

    const deletedRecord = result[0]
    console.log("🗑️ [TEST FORM] Deleted record:", deletedRecord.name)

    return NextResponse.json({
      success: true,
      message: "Test record deleted successfully",
    })
  } catch (error) {
    console.error("🗑️ [TEST FORM] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete test record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
