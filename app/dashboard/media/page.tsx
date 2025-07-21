"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Search, Video, FileText, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard-layout"

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  created_at: string
  mime_type?: string
  dimensions?: string
  duration?: number
  media_source?: string
  external_url?: string
}

export default function MediaPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [deleteFile, setDeleteFile] = useState<MediaFile | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showGoogleSlidesDialog, setShowGoogleSlidesDialog] = useState(false)

  const loadMediaFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("📁 [MEDIA PAGE] Fetching media files...")

      const response = await fetch("/api/media", {
        credentials: "include",
      })

      const data = await response.json()
      console.log("📁 [MEDIA PAGE] API response:", response.status, data)

      if (response.ok && data.success) {
        setMediaFiles(data.files || data.media || [])
        setError(null)
        console.log("📁 [MEDIA PAGE] Loaded", data.files?.length || 0, "media files")
      } else {
        if (response.status === 401) {
          console.log("📁 [MEDIA PAGE] 401 Unauthorized - redirecting to login")
          window.location.href = "/login"
        } else {
          setError(data.error || `Failed to load media files (${response.status})`)
          console.error("📁 [MEDIA PAGE] API error:", data)
        }
      }
    } catch (err) {
      console.error("📁 [MEDIA PAGE] Network error:", err)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMediaFiles()
  }, [])

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleUploadComplete = () => {
    loadMediaFiles() // Reload the media files
    setShowUploadDialog(false)
    triggerRefresh() // Trigger usage dashboard refresh
  }

  const handleGoogleSlidesAdded = () => {
    loadMediaFiles()
    setShowGoogleSlidesDialog(false)
    triggerRefresh()
  }

  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  const handleDelete = async (file: MediaFile) => {
    setDeleteFile(file)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteFile) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/media/${deleteFile.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMediaFiles((prev) => prev.filter((f) => f.id !== deleteFile.id))
        setShowDeleteDialog(false)
        setDeleteFile(null)
        triggerRefresh() // This should refresh usage data
        console.log("📁 [MEDIA PAGE] File deleted:", data.message)
      } else {
        if (response.status === 401) {
          window.location.href = "/login"
        } else {
          setError(data.error || "Failed to delete file")
        }
      }
    } catch (err) {
      setError("Failed to delete file")
      console.error("📁 [MEDIA PAGE] Error deleting file:", err)
    } finally {
      setDeleting(false)
    }
  }

  const getFileIcon = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"
    const isVideo = file.mime_type?.startsWith("video/") || file.file_type === "video"
    const isPresentation = file.file_type === "presentation"

    if (isVideo) return <Video className="h-4 w-4" />
    if (isPresentation) return <ExternalLink className="h-4 w-4" />
    if (isImage) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getFileTypeColor = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"
    const isVideo = file.mime_type?.startsWith("video/") || file.file_type === "video"
    const isPDF = file.mime_type === "application/pdf"
    const isAudio = file.mime_type?.startsWith("audio/")
    const isPresentation = file.file_type === "presentation"
    const isOffice =
      file.mime_type?.includes("office") ||
      file.mime_type?.includes("powerpoint") ||
      file.mime_type?.includes("presentation")

    if (isVideo) return "bg-blue-100 text-blue-800"
    if (isPresentation) return "bg-purple-100 text-purple-800"
    if (isImage) return "bg-green-100 text-green-800"
    if (isPDF) return "bg-red-100 text-red-800"
    if (isAudio) return "bg-purple-100 text-purple-800"
    if (isOffice) return "bg-orange-100 text-orange-800"
    return "bg-gray-100 text-gray-800"
  }

  const getFileTypeLabel = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"
    const isVideo = file.mime_type?.startsWith("video/") || file.file_type === "video"
    const isPDF = file.mime_type === "application/pdf"
    const isAudio = file.mime_type?.startsWith("audio/")
    const isPresentation = file.file_type === "presentation"
    const isOffice =
      file.mime_type?.includes("office") ||
      file.mime_type?.includes("powerpoint") ||
      file.mime_type?.includes("presentation")

    if (isVideo) return "video"
    if (isPresentation) return "slides"
    if (isImage) return "image"
    if (isPDF) return "pdf"
    if (isAudio) return "audio"
    if (isOffice) return "office"
    return "document"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // FIXED: Safe filtering with null checks
  const filteredFiles = mediaFiles.filter((file) => {
    const fileName = file.original_name || file.filename || ""
    return fileName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleDownload = (file: MediaFile) => {
    if (file.file_type === "presentation" && file.media_source === "google_slides") {
      // For Google Slides, copy the link to clipboard and open in new tab
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(file.external_url || file.url)
          .then(() => {
            console.log("Google Slides link copied to clipboard")
          })
          .catch(() => {
            console.log("Failed to copy link to clipboard")
          })
      }
      window.open(file.external_url || file.url, "_blank")
    } else {
      // Regular file download
      const link = document.createElement("a")
      link.href = file.url
      link.download = file.original_name
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-gray-600">Upload and manage your digital content</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowGoogleSlidesDialog(true)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Add Google Slides
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <\
