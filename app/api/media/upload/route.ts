import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
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

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm", ".pdf"]

export async function POST(request: NextRequest) {
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

    // Debug: Show detailed file info
    console.log("📁 File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    })

    // Get file extension
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
    console.log("📎 File extension:", fileExtension)

    // Validate by MIME type OR file extension (more flexible)
    const isValidMimeType = ALLOWED_TYPES.includes(file.type)
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension)

    if (!isValidMimeType && !isValidExtension) {
      console.log("❌ File validation failed:", {
        mimeType: file.type,
        extension: fileExtension,
        allowedTypes: ALLOWED_TYPES,
        allowedExtensions: ALLOWED_EXTENSIONS,
      })

      return NextResponse.json(
        {
          error: `File not supported`,
          details: {
            detected_mime_type: file.type,
            detected_extension: fileExtension,
            filename: file.name,
            allowed_types: ALLOWED_TYPES,
            allowed_extensions: ALLOWED_EXTENSIONS,
          },
        },
        { status: 400 },
      )
    }

    // If MIME type is wrong but extension is right, fix it
    let correctedMimeType = file.type
    if (!isValidMimeType && isValidExtension) {
      console.log("🔧 Correcting MIME type based on extension")
      switch (fileExtension) {
        case ".jpg":
        case ".jpeg":
          correctedMimeType = "image/jpeg"
          break
        case ".png":
          correctedMimeType = "image/png"
          break
        case ".gif":
          correctedMimeType = "image/gif"
          break
        case ".webp":
          correctedMimeType = "image/webp"
          break
        case ".mp4":
          correctedMimeType = "video/mp4"
          break
        case ".webm":
          correctedMimeType = "video/webm"
          break
        case ".pdf":
          correctedMimeType = "application/pdf"
          break
      }
      console.log("✅ MIME type corrected:", file.type, "→", correctedMimeType)
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      )
    }

    const sql = getDb()

    // Check user's current usage
    const userResult = await sql`
      SELECT plan_type, media_files_count, storage_used_bytes
      FROM users 
      WHERE id = ${user.id}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userResult[0]
    const currentFiles = userData.media_files_count || 0
    const currentStorage = userData.storage_used_bytes || 0

    // Check free plan limits
    if (currentFiles >= 5) {
      return NextResponse.json(
        {
          error: "Upload limit exceeded",
          message: "Free plan allows 5 media files. Upgrade to upload more.",
          upgrade_required: true,
        },
        { status: 403 },
      )
    }

    if (currentStorage + file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: "Free plan allows 100MB total storage. Upgrade for more space.",
          upgrade_required: true,
        },
        { status: 403 },
      )
    }

    // Create mock storage URL (we'll add real Vercel Blob later)
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${user.id}/${timestamp}-${sanitizedName}`
    const mockUrl = `/uploads/${timestamp}-${sanitizedName}`

    // Determine file type category
    const getFileType = (mimeType: string): string => {
      if (mimeType.startsWith("image/")) return "image"
      if (mimeType.startsWith("video/")) return "video"
      if (mimeType === "application/pdf") return "document"
      return "other"
    }

    console.log("🔍 Saving to database...")

    // Insert with corrected MIME type
    const mediaResult = await sql`
      INSERT INTO media_files (
        user_id, filename, original_name, file_type, file_size, 
        mime_type, storage_url, created_at
      ) VALUES (
        ${user.id}, 
        ${uniqueFilename}, 
        ${file.name}, 
        ${getFileType(correctedMimeType)}, 
        ${file.size},
        ${correctedMimeType},
        ${mockUrl}, 
        NOW()
      )
      RETURNING *
    `

    console.log("✅ Media file saved")

    // Update user's usage counters
    await sql`
      UPDATE users 
      SET 
        media_files_count = COALESCE(media_files_count, 0) + 1,
        storage_used_bytes = COALESCE(storage_used_bytes, 0) + ${file.size}
      WHERE id = ${user.id}
    `

    console.log("✅ User usage updated")

    return NextResponse.json({
      success: true,
      file: mediaResult[0],
      message: "File uploaded successfully (demo mode)",
      debug: {
        original_mime_type: file.type,
        corrected_mime_type: correctedMimeType,
        file_extension: fileExtension,
      },
    })
  } catch (error) {
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
