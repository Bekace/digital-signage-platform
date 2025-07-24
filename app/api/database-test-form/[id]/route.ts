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

    console.log(`🗑️ [DATABASE TEST] Deleting record ID: ${id}`)

    // Delete the record
    const result = await sql`
      DELETE FROM test_records 
      WHERE id = ${id}
      RETURNING id, name
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    console.log("✅ [DATABASE TEST] Record deleted successfully!")

    return NextResponse.json({
      success: true,
      message: "Record deleted successfully",
      deleted: result[0],
    })
  } catch (error) {
    console.error("❌ [DATABASE TEST] Delete failed:", error)

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
    const { name } = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    console.log(`✏️ [DATABASE TEST] Updating record ID: ${id} with name: ${name}`)

    // Update the record
    const result = await sql`
      UPDATE test_records 
      SET name = ${name}
      WHERE id = ${id}
      RETURNING id, name, created_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    console.log("✅ [DATABASE TEST] Record updated successfully!")

    return NextResponse.json({
      success: true,
      message: "Record updated successfully",
      record: result[0],
    })
  } catch (error) {
    console.error("❌ [DATABASE TEST] Update failed:", error)

    return NextResponse.json(
      {
        error: "Failed to update record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
