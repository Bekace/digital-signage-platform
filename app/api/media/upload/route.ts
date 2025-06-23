import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { canUploadFile } from "@/lib/plans"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Documents
  "application/pdf",
]

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported. Allowed types: images, videos, PDFs` },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      )
    }

    const sql = getDb()

    // Get user's current usage and plan limits
    const userResult = await sql`
      SELECT u.plan_type, u.media_files_count, u.storage_used_bytes, u.screens_count,
             pl.max_media_files, pl.max_storage_bytes, pl.max_screens
      FROM users u
      JOIN plan_limits pl ON u.plan_type = pl.plan_type
      WHERE u.id = ${user.id}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User or plan not found" }, { status: 404 })
    }

    const userData = userResult[0]

    // Check if user can upload this file
    const uploadCheck = canUploadFile(
      {
        media_files_count: userData.media_files_count || 0,
        storage_used_bytes: userData.storage_used_bytes || 0,
        screens_count: userData.screens_count || 0,
        plan_type: userData.plan_type,
      },
      {
        plan_type: userData.plan_type,
        max_media_files: userData.max_media_files,
        max_storage_bytes: userData.max_storage_bytes,
        max_screens: userData.max_screens,
        price_monthly: 0,
        features: [],
      },
      file.size,
    )

    if (!uploadCheck.allowed) {
      return NextResponse.json(
        {
          error: "Upload limit exceeded",
          message: uploadCheck.reason,
          upgrade_required: true,
        },
        { status: 403 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${user.id}/${timestamp}-${sanitizedName}`

    // Upload to Vercel Blob
    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`)
    const blob = await put(uniqueFilename, file, {
      access: "public",
    })

    // Get file type category
    const getFileType = (mimeType: string): string => {
      if (mimeType.startsWith("image/")) return "image"
      if (mimeType.startsWith("video/")) return "video"
      if (mimeType === "application/pdf") return "document"
      return "other"
    }

    // Get image/video dimensions (simplified)
    const getDimensions = (file: File): Promise<string | null> => {
      return new Promise((resolve) => {
        if (file.type.startsWith("image/")) {
          const img = new Image()
          img.onload = () => resolve(`${img.width}x${img.height}`)
          img.onerror = () => resolve(null)
          img.src = URL.createObjectURL(file)
        } else {
          resolve(null)
        }
      })
    }

    const dimensions = await getDimensions(file)

    // Save to database
    const mediaResult = await sql`
      INSERT INTO media_files (
        user_id, filename, original_name, file_type, file_size, 
        mime_type, storage_url, dimensions, created_at
      ) VALUES (
        ${user.id}, ${uniqueFilename}, ${file.name}, ${getFileType(file.type)}, 
        ${file.size}, ${file.type}, ${blob.url}, ${dimensions}, NOW()
      )
      RETURNING *
    `

    // Update user's usage counters
    await sql`
      UPDATE users 
      SET 
        media_files_count = media_files_count + 1,
        storage_used_bytes = storage_used_bytes + ${file.size}
      WHERE id = ${user.id}
    `

    console.log(`✅ File uploaded successfully: ${blob.url}`)

    return NextResponse.json({
      success: true,
      file: mediaResult[0],
      blob_url: blob.url,
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("❌ Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
