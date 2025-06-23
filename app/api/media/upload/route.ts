import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB per file
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

    console.log("📁 File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    // Get file extension
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    // Validate by MIME type OR file extension
    const isValidMimeType = ALLOWED_TYPES.includes(file.type)
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension)

    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json(
        {
          error: `File not supported`,
          details: {
            detected_mime_type: file.type,
            detected_extension: fileExtension,
            filename: file.name,
          },
        },
        { status: 400 },
      )
    }

    // Fix MIME type if needed
    let correctedMimeType = file.type
    if (!isValidMimeType && isValidExtension) {
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
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size per file: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      )
    }

    const sql = getDb()

    // Get user's current usage and plan limits
    const userResult = await sql`
      SELECT u.plan_type, u.media_files_count, u.storage_used_bytes,
             pl.max_media_files, pl.max_storage_bytes
      FROM users u
      LEFT JOIN plan_limits pl ON u.plan_type = pl.plan_type
      WHERE u.id = ${user.id}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userResult[0]
    const currentFiles = userData.media_files_count || 0
    const currentStorage = Number.parseInt(userData.storage_used_bytes) || 0
    const maxFiles = userData.max_media_files || 5
    const maxStorage = Number.parseInt(userData.max_storage_bytes) || 104857600

    // Check limits
    if (currentFiles >= maxFiles) {
      return NextResponse.json(
        {
          error: "Upload limit exceeded",
          message: `${userData.plan_type} plan allows ${maxFiles} media files. Upgrade to upload more.`,
          upgrade_required: true,
        },
        { status: 403 },
      )
    }

    if (currentStorage + file.size > maxStorage) {
      const maxStorageMB = Math.round(maxStorage / 1024 / 1024)
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: `${userData.plan_type} plan allows ${maxStorageMB}MB total storage. Upgrade for more space.`,
          upgrade_required: true,
        },
        { status: 403 },
      )
    }

    // Upload to Vercel Blob
    console.log("☁️ Uploading to Vercel Blob...")
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${user.id}/${timestamp}-${sanitizedName}`

    const blob = await put(uniqueFilename, file, {
      access: "public",
      contentType: correctedMimeType,
    })

    console.log("✅ File uploaded to Blob:", blob.url)

    // Determine file type category
    const getFileTypeCategory = (mimeType: string): string => {
      if (mimeType.startsWith("image/")) return "image"
      if (mimeType.startsWith("video/")) return "video"
      if (mimeType === "application/pdf") return "document"
      return "other"
    }

    // Save to database
    const mediaResult = await sql`
      INSERT INTO media_files (
        user_id, 
        filename, 
        original_name,
        file_type,
        file_size, 
        url,
        mime_type,
        created_at
      ) VALUES (
        ${user.id}, 
        ${uniqueFilename}, 
        ${file.name},
        ${getFileTypeCategory(correctedMimeType)},
        ${file.size}, 
        ${blob.url},
        ${correctedMimeType},
        NOW()
      )
      RETURNING *
    `

    // Update user usage
    await sql`
      UPDATE users 
      SET 
        media_files_count = COALESCE(media_files_count, 0) + 1,
        storage_used_bytes = COALESCE(storage_used_bytes::bigint, 0) + ${file.size}
      WHERE id = ${user.id}
    `

    console.log("✅ Database updated")

    return NextResponse.json({
      success: true,
      file: mediaResult[0],
      message: "File uploaded successfully",
      blob_url: blob.url,
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
