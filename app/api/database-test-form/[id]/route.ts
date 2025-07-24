import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { name, email } = await request.json()
    const id = Number.parseInt(params.id)

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Update the record
    const result = await sql`
      UPDATE test_records 
      SET name = ${name}, email = ${email}
      WHERE id = ${id}
      RETURNING id, name, email, created_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Record updated successfully",
      record: result[0],
    })
  } catch (error) {
    console.error("❌ Error updating test record:", error)
    return NextResponse.json(
      {
        error: "Failed to update test record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Delete the record
    const result = await sql`
      DELETE FROM test_records 
      WHERE id = ${id}
      RETURNING id, name, email
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Record deleted successfully",
      record: result[0],
    })
  } catch (error) {
    console.error("❌ Error deleting test record:", error)
    return NextResponse.json(
      {
        error: "Failed to delete test record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
