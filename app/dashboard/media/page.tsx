"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Upload, MoreVertical, Eye, Download, Trash2, FileImage, Video, FileText, Music } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UploadMediaDialog } from "@/components/upload-media-dialog"
import { MediaPreviewModal } from "@/components/media-preview-modal"
import { UsageDashboard } from "@/components/usage-dashboard"

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  url: string
  mime_type: string
  created_at: string
}

export default function MediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [deleteFile, setDeleteFile] = useState<MediaFile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchMediaFiles()
  }, [])

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch("/api/media")
      if (response.ok) {
        const data = await response.json()
        setMediaFiles(data.files)
      }
    } catch (error) {
      console.error("Failed to fetch media files:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = () => {
    console.log("Upload completed successfully, triggering refresh...")
    fetchMediaFiles()
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleDeleteFile = async () => {
    if (!deleteFile) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/media/${deleteFile.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove from local state immediately
        setMediaFiles((prev) => prev.filter((file) => file.id !== deleteFile.id))
        // Trigger usage dashboard refresh
        setRefreshTrigger((prev) => prev + 1)
        setDeleteFile(null)
      } else {
        console.error("Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    } finally {
      setDeleting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return <FileImage className="h-4 w-4" />
    if (mimeType?.startsWith("video/")) return <Video className="h-4 w-4" />
    if (mimeType?.startsWith("audio/")) return <Music className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return "bg-green-100 text-green-800"
    if (mimeType?.startsWith("video/")) return "bg-blue-100 text-blue-800"
    if (mimeType?.startsWith("audio/")) return "bg-purple-100 text-purple-800"
    if (mimeType?.includes("pdf")) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const getThumbnail = (file: MediaFile) => {
    const isImage = file.mime_type?.startsWith("image/")

    if (isImage) {
      return file.url // Use actual image
    }

    // Use custom thumbnails based on file type
    if (file.mime_type === "application/pdf") return "/thumbnails/pdf.png"
    if (file.mime_type?.startsWith("video/")) return "/thumbnails/video.png"
    if (file.mime_type?.startsWith("audio/")) return "/thumbnails/audio.png"
    if (
      file.mime_type?.includes("word") ||
      file.mime_type?.includes("powerpoint") ||
      file.mime_type?.includes("excel")
    ) {
      return "/thumbnails/office.png"
    }

    return "/thumbnails/generic.png" // Default fallback
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Media Library</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-gray-600">Manage your media files and assets</p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {mediaFiles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileImage className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No media files</h3>
                  <p className="text-gray-500 text-center mb-4">Get started by uploading your first media file</p>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Media
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mediaFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={getThumbnail(file) || "/placeholder.svg"}
                        alt={file.original_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to generic thumbnail if custom thumbnail fails
                          e.currentTarget.src = "/thumbnails/generic.png"
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFile(file)
                                setShowPreview(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteFile(file)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate" title={file.original_name}>
                            {file.original_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={getFileTypeColor(file.mime_type)}>
                              <span className="flex items-center gap-1">
                                {getFileIcon(file.mime_type)}
                                {file.file_type?.toUpperCase()}
                              </span>
                            </Badge>
                            <span className="text-sm text-gray-500">{formatFileSize(file.file_size)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <UsageDashboard refreshTrigger={refreshTrigger} />
          </div>
        </div>

        <UploadMediaDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUploadComplete={handleUploadComplete}
        />

        {selectedFile && <MediaPreviewModal file={selectedFile} open={showPreview} onOpenChange={setShowPreview} />}

        <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Media File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteFile?.original_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFile} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
