"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Upload, Search, Filter, MoreHorizontal, Download, Trash2, Eye, Video, FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UploadMediaDialog } from "@/components/upload-media-dialog"
import { UsageDashboard } from "@/components/usage-dashboard"
import { MediaPreviewModal } from "@/components/media-preview-modal"

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
}

export default function MediaPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const loadMediaFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/media")
      const data = await response.json()

      if (response.ok) {
        setMediaFiles(data.files || [])
        setError(null)
      } else {
        setError(data.error || "Failed to load media files")
      }
    } catch (err) {
      setError("Failed to load media files")
      console.error("Error loading media files:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMediaFiles()
  }, [])

  const handleUploadComplete = () => {
    // Reload media files and close dialog
    loadMediaFiles()
    setShowUploadDialog(false)
  }

  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  const getFileIcon = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"
    const isVideo = file.mime_type?.startsWith("video/") || file.file_type === "video"

    if (isVideo) return <Video className="h-4 w-4" />
    if (isImage) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getFileTypeColor = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"
    const isVideo = file.mime_type?.startsWith("video/") || file.file_type === "video"

    if (isVideo) return "bg-blue-100 text-blue-800"
    if (isImage) return "bg-green-100 text-green-800"
    return "bg-orange-100 text-orange-800"
  }

  const getFileTypeLabel = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"
    const isVideo = file.mime_type?.startsWith("video/") || file.file_type === "video"

    if (isVideo) return "video"
    if (isImage) return "image"
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

  const getThumbnail = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"

    if (isImage) {
      // For images, use the actual image as thumbnail
      return file.url
    }

    // For non-images, use placeholder
    return `/placeholder.svg?height=128&width=200&text=${encodeURIComponent(file.original_name.split(".").pop()?.toUpperCase() || "FILE")}`
  }

  const filteredFiles = mediaFiles.filter((file) => file.original_name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-gray-600">Upload and manage your digital content</p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>

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
        <UsageDashboard />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading media files...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadMediaFiles} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredFiles.length === 0 && (
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
        {!loading && !error && filteredFiles.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={getThumbnail(file) || "/placeholder.svg"}
                        alt={file.original_name}
                        className="w-full h-32 object-cover rounded-lg bg-gray-100 cursor-pointer"
                        onClick={() => handlePreview(file)}
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = `/placeholder.svg?height=128&width=200&text=${encodeURIComponent(file.original_name.split(".").pop()?.toUpperCase() || "FILE")}`
                        }}
                      />
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
                            <DropdownMenuItem onClick={() => window.open(file.url, "_blank")}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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
                      <h3 className="font-medium text-sm truncate" title={file.original_name}>
                        {file.original_name}
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
      </div>
    </DashboardLayout>
  )
}
