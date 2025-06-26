import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { put } from "@vercel/blob"
import { auth } from "@/auth"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file: File | null = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    const user = await auth()
    if (!user || !user.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const filename = uuidv4()
    const fileType = file.name.split(".").pop()

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    })

    // After successful upload, generate thumbnail for images
    let thumbnailUrl = null
    if (file.type.startsWith("image/")) {
      // For images, use the original image as thumbnail (Vercel Blob will handle resizing)
      thumbnailUrl = blob.url
    } else if (file.type.startsWith("video/")) {
      // For videos, we'll use a placeholder for now
      // In production, you'd want to generate actual video thumbnails
      thumbnailUrl = "/thumbnails/video.png"
    }

    // Update the database insert to include thumbnail_url
    const result = await sql`
      INSERT INTO media_files (
        user_id, filename, original_name, file_type, file_size, 
        mime_type, url, thumbnail_url, created_at
      ) VALUES (
        ${user.user.id}, ${filename}, ${file.name}, ${fileType}, ${file.size},
        ${file.type}, ${blob.url}, ${thumbnailUrl}, NOW()
      ) RETURNING *
    `

    return NextResponse.json({ ...result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
