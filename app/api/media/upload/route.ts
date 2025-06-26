import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { Buffer } from "buffer"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
]

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("🔍 Starting file upload...")

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("📁 File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not supported` }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      )
    }

    // Convert file to base64 for storage
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    const db = getDb()

    // Create unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${user.id}/${timestamp}-${sanitizedName}`

    // Determine file type category
    const getFileTypeCategory = (mimeType: string): string => {
      if (mimeType.startsWith("image/")) return "image"
      if (mimeType.startsWith("video/")) return "video"
      if (mimeType === "application/pdf") return "document"
      return "other"
    }

    // Generate thumbnail URL
    let thumbnailUrl = null
    if (file.type.startsWith("image/")) {
      thumbnailUrl = dataUrl // Use the image itself as thumbnail
    } else if (file.type.startsWith("video/")) {
      thumbnailUrl = "/thumbnails/video.png"
    } else if (file.type === "application/pdf") {
      thumbnailUrl = "/thumbnails/pdf.png"
    } else {
      thumbnailUrl = "/thumbnails/generic.png"
    }

    console.log("🔍 Saving to database...")

    // Insert into media_files table
    const mediaResult = await db`
      INSERT INTO media_files (
        user_id, 
        filename, 
        original_name,
        file_type,
        file_size, 
        url,
        thumbnail_url,
        mime_type,
        created_at
      ) VALUES (
        ${user.id}, 
        ${uniqueFilename}, 
        ${file.name},
        ${getFileTypeCategory(file.type)},
        ${file.size}, 
        ${dataUrl},
        ${thumbnailUrl},
        ${file.type},
        NOW()
      )
      RETURNING *
    `

    console.log("✅ Media file saved successfully!")

    // Update user's usage counters
    await db`
      UPDATE users 
      SET 
        media_files_count = COALESCE(media_files_count, 0) + 1,
        storage_used_bytes = COALESCE(storage_used_bytes::bigint, 0) + ${file.size}
      WHERE id = ${user.id}
    `

    console.log("✅ User usage updated")

    return NextResponse.json({
      success: true,
      file: mediaResult.rows[0],
      message: "File uploaded successfully",
      debug: {
        file_type: file.type,
        file_size: file.size,
        base64_length: dataUrl.length,
        saved_to_db: true,
      },
    })
  } catch (error: any) {
    console.error("❌ Upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
