"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Video,
  FileText,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UploadMediaDialog } from "@/components/upload-media-dialog"
import { UsageDashboard } from "@/components/usage-dashboard"
import { MediaPreviewModal } from "@/components/media-preview-modal"
import { MediaThumbnail } from "@/components/media-thumbnail"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { GoogleSlidesDialog } from "@/components/google-slides-dialog"
import { getAuthHeaders, isTokenValid, redirectToLogin, getTokenInfo } from "@/lib/auth-utils"

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
  const [authError, setAuthError] = useState<string | null>(null)

  const loadMediaFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      setAuthError(null)

      console.log("📁 [MEDIA PAGE] Starting to load media files...")

      // Debug token information
      const tokenInfo = getTokenInfo()
      console.log("📁 [MEDIA PAGE] Token info:", tokenInfo)

      // Check if token is valid before making request
      const tokenValid = isTokenValid()
      console.log("📁 [MEDIA PAGE] Token valid:", tokenValid)

      if (!tokenValid) {
        console.log("📁 [MEDIA PAGE] Invalid token detected, redirecting to login")
        setAuthError("Your session has expired. Please log in again.")
        setTimeout(() => redirectToLogin(), 2000)
        return
      }

      const authHeaders = getAuthHeaders()
      console.log("📁 [MEDIA PAGE] Auth headers:", authHeaders ? "Available" : "Not available")

      if (!authHeaders) {
        console.log("📁 [MEDIA PAGE] No auth headers available")
        setAuthError("Authentication required. Redirecting to login...")
        setTimeout(() => redirectToLogin(), 2000)
        return
      }

      console.log("📁 [MEDIA PAGE] Making API request with auth headers")
      const response = await fetch("/api/media", {
        method: "GET",
        headers: authHeaders,
      })

      const data = await response.json()
      console.log("📁 [MEDIA PAGE] API response:", response.status, data)

      if (response.ok && data.success) {
        setMediaFiles(data.files || data.media || [])
        setError(null)
        console.log("📁 [MEDIA PAGE] Loaded", data.files?.length || 0, "media files")
      } else {
        if (response.status === 401) {
          console.log("📁 [MEDIA PAGE] 401 Unauthorized response")
          setAuthError("Authentication failed. Please log in again.")
          setTimeout(() => redirectToLogin(), 2000)
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

      const authHeaders = getAuthHeaders()
      if (!authHeaders) {
        setAuthError("Authentication required. Please log in again.")
        setTimeout(() => redirectToLogin(), 2000)
        return
      }

      const response = await fetch(`/api/media/${deleteFile.id}`, {
        method: "DELETE",
        headers: authHeaders,
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
          setAuthError("Authentication failed. Please log in again.")
          setTimeout(() => redirectToLogin(), 2000)
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

        {/* Authentication Error Alert */}
        {authError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filter */}
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search media files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Usage Dashboard */}
        <UsageDashboard refreshTrigger={refreshTrigger} />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading media files...</span>
          </div>
        )}

        {/* Error State */}
        {error && !authError && (
          <div className="text-center py-12">
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={loadMediaFiles} variant="outline" className="mt-4 bg-transparent">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !authError && filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media files yet</h3>
            <p className="text-gray-500 mb-4">Upload your first image, video, or document to get started.</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>
        )}

        {/* Media Grid */}
        {!loading && !error && !authError && filteredFiles.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="w-full h-32 rounded-lg bg-gray-100 cursor-pointer overflow-hidden">
                        <MediaThumbnail
                          file={{
                            ...file,
                            original_filename: file.original_name,
                          }}
                          size="lg"
                          className="w-full h-full"
                          onClick={() => handlePreview(file)}
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(file)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(file)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Badge className={`${getFileTypeColor(file)} text-xs`}>
                          {getFileIcon(file)}
                          <span className="ml-1 capitalize">{getFileTypeLabel(file)}</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm truncate" title={file.original_name || file.filename}>
                        {file.original_name || file.filename || "Untitled"}
                      </h3>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{formatFileSize(file.file_size)}</span>
                        </div>
                        {file.dimensions && (
                          <div className="flex justify-between">
                            <span>Dimensions:</span>
                            <span>{file.dimensions}</span>
                          </div>
                        )}
                        {file.duration && (
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>
                              {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <UploadMediaDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUploadComplete={handleUploadComplete}
        />

        <MediaPreviewModal file={previewFile} open={showPreview} onOpenChange={setShowPreview} />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteFile?.original_name || deleteFile?.filename || "this file"}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <GoogleSlidesDialog
          open={showGoogleSlidesDialog}
          onOpenChange={setShowGoogleSlidesDialog}
          onSlidesAdded={handleGoogleSlidesAdded}
        />
      </div>
    </DashboardLayout>
  )
}
