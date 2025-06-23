import { type NextRequest, NextResponse } from "next/server"
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

    // Validate file size (per file limit)
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

    // Convert storage values to numbers to avoid string concatenation
    const currentStorage = Number.parseInt(userData.storage_used_bytes) || 0
    const maxFiles = userData.max_media_files || 5
    const maxStorage = Number.parseInt(userData.max_storage_bytes) || 104857600 // 100MB default

    console.log("📊 Usage check:", {
      currentFiles,
      maxFiles,
      currentStorage,
      maxStorage,
      fileSize: file.size,
      newTotal: currentStorage + file.size,
    })

    // Check file count limit
    if (currentFiles >= maxFiles) {
      return NextResponse.json(
        {
          error: "Upload limit exceeded",
          message: `${userData.plan_type} plan allows ${maxFiles} media files. Upgrade to upload more.`,
          upgrade_required: true,
          debug: {
            current_files: currentFiles,
            max_files: maxFiles,
            plan_type: userData.plan_type,
          },
        },
        { status: 403 },
      )
    }

    // Check storage limit (use plan's storage limit, not per-file limit)
    if (currentStorage + file.size > maxStorage) {
      const maxStorageMB = Math.round(maxStorage / 1024 / 1024)
      const currentStorageMB = Math.round(currentStorage / 1024 / 1024)
      const fileSizeMB = Math.round(file.size / 1024 / 1024)

      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: `${userData.plan_type} plan allows ${maxStorageMB}MB total storage. Upgrade for more space.`,
          upgrade_required: true,
          debug: {
            current_storage_bytes: currentStorage,
            current_storage_mb: currentStorageMB,
            max_storage_bytes: maxStorage,
            max_storage_mb: maxStorageMB,
            file_size_bytes: file.size,
            file_size_mb: fileSizeMB,
            new_total_bytes: currentStorage + file.size,
            new_total_mb: Math.round((currentStorage + file.size) / 1024 / 1024),
            plan_type: userData.plan_type,
          },
        },
        { status: 403 },
      )
    }

    // Create storage URLs
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${user.id}/${timestamp}-${sanitizedName}`
    const storageUrl = `/uploads/${timestamp}-${sanitizedName}`

    // Determine file type category
    const getFileTypeCategory = (mimeType: string): string => {
      if (mimeType.startsWith("image/")) return "image"
      if (mimeType.startsWith("video/")) return "video"
      if (mimeType === "application/pdf") return "document"
      return "other"
    }

    console.log("🔍 Saving to database...")

    // Insert with all required columns based on your table structure
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
        ${storageUrl},
        ${correctedMimeType},
        NOW()
      )
      RETURNING *
    `

    console.log("✅ Media file saved")

    // Update user's usage counters (ensure we're adding numbers, not concatenating strings)
    await sql`
      UPDATE users 
      SET 
        media_files_count = COALESCE(media_files_count, 0) + 1,
        storage_used_bytes = COALESCE(storage_used_bytes::bigint, 0) + ${file.size}
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
        usage_after_upload: {
          files: currentFiles + 1,
          storage_bytes: currentStorage + file.size,
          storage_mb: Math.round((currentStorage + file.size) / 1024 / 1024),
        },
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
