import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fileId = Number.parseInt(params.id)
    if (isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    const sql = getDb()

    // First, check if the file exists and belongs to the user
    const existingFile = await sql`
      SELECT id, file_size, original_name 
      FROM media_files 
      WHERE id = ${fileId} AND user_id = ${user.id}
    `

    if (existingFile.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = existingFile[0]

    // Delete the file from the database
    await sql`
      DELETE FROM media_files 
      WHERE id = ${fileId} AND user_id = ${user.id}
    `

    // Update user's storage usage
    await sql`
      UPDATE user_plans 
      SET storage_used = GREATEST(0, storage_used - ${file.file_size}),
          files_used = GREATEST(0, files_used - 1)
      WHERE user_id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: `File "${file.original_name}" deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting media file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
