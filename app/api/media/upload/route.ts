import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // Get file info
    const fileName = file.name
    const fileSize = file.size
    const fileType = file.type

    // Insert into database
    const result = await sql`
      INSERT INTO media (
        name, 
        type, 
        size, 
        url, 
        thumbnail_url,
        created_at
      ) VALUES (
        ${fileName},
        ${fileType},
        ${fileSize},
        ${dataUrl},
        ${dataUrl},
        NOW()
      ) RETURNING *
    `

    return NextResponse.json({
      success: true,
      media: result[0],
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
