"use client"

import { useState, useEffect } from "react"
import { Upload, Search, Filter, Grid, List, Trash2, Eye, Download, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UploadMediaDialog } from "@/components/upload-media-dialog"
import { GoogleSlidesDialog } from "@/components/google-slides-dialog"
import { MediaPreviewModal } from "@/components/media-preview-modal"
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

interface MediaFile {
  id: number
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  created_at: string
  duration?: number
  dimensions?: string
}

export default function MediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showGoogleSlidesDialog, setShowGoogleSlidesDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null)

  useEffect(() => {
    fetchMediaFiles()
  }, [])

  const fetchMediaFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/media")
      const data = await response.json()

      if (response.ok) {
        // Use 'files' property for media library page
        setMediaFiles(data.files || [])
      } else {
        toast.error("Failed to load media files")
      }
    } catch (error) {
      console.error("Error fetching media files:", error)
      toast.error("Failed to load media files")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (file: MediaFile) => {
    try {
      const response = await fetch(`/api/media/${file.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMediaFiles((prev) => prev.filter((f) => f.id !== file.id))
        toast.success("File deleted successfully")
      } else {
        toast.error("Failed to delete file")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Failed to delete file")
    } finally {
      setFileToDelete(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith("image/")) return "bg-blue-100 text-blue-800"
    if (fileType.startsWith("video/")) return "bg-purple-100 text-purple-800"
    if (fileType.includes("pdf")) return "bg-red-100 text-red-800"
    if (fileType.includes("presentation") || fileType.includes("slides")) return "bg-orange-100 text-orange-800"
    return "bg-gray-100 text-gray-800"
  }

  const filteredFiles = mediaFiles.filter((file) =>
    file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const MediaCard = ({ file }: { file: MediaFile }) => (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
          {file.thumbnail_url ? (
            <img
              src={file.thumbnail_url || "/placeholder.svg"}
              alt={file.original_filename}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
                target.nextElementSibling?.classList.remove("hidden")
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${file.thumbnail_url ? "hidden" : ""}`}>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                {file.file_type.startsWith("image/") && <Eye className="h-6 w-6 text-gray-500" />}
                {file.file_type.startsWith("video/") && <Eye className="h-6 w-6 text-gray-500" />}
                {file.file_type.includes("pdf") && <Eye className="h-6 w-6 text-gray-500" />}
              </div>
              <p className="text-xs text-gray-500 capitalize">{file.file_type.split("/")[0]}</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedFile(file)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(file.url, "_blank")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFileToDelete(file)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-sm truncate" title={file.original_filename}>
            {file.original_filename}
          </h3>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className={getFileTypeColor(file.file_type)}>
              {file.file_type.split("/")[0]}
            </Badge>
            <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const MediaListItem = ({ file }: { file: MediaFile }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {file.thumbnail_url ? (
              <img
                src={file.thumbnail_url || "/placeholder.svg"}
                alt={file.original_filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{file.original_filename}</h3>
            <div className="flex items-center space-x-4 mt-1">
              <Badge variant="secondary" className={getFileTypeColor(file.file_type)}>
                {file.file_type.split("/")[0]}
              </Badge>
              <span className="text-sm text-gray-500">{formatFileSize(file.file_size)}</span>
              <span className="text-sm text-gray-500">{new Date(file.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(file)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(file.url, "_blank")}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFileToDelete(file)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-gray-600">Manage your media files and assets</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowGoogleSlidesDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Google Slides
            </Button>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search media files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Media Grid/List */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}>
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="aspect-video w-full mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No media files</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchQuery ? "No files match your search criteria." : "Upload your first media file to get started."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFiles.map((file) => (
              <MediaCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFiles.map((file) => (
              <MediaListItem key={file.id} file={file} />
            ))}
          </div>
        )}

        {/* Upload Dialog */}
        <UploadMediaDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onUploadComplete={fetchMediaFiles}
        />

        {/* Google Slides Dialog */}
        <GoogleSlidesDialog
          open={showGoogleSlidesDialog}
          onOpenChange={setShowGoogleSlidesDialog}
          onUploadComplete={fetchMediaFiles}
        />

        {/* Preview Modal */}
        {selectedFile && (
          <MediaPreviewModal file={selectedFile} open={!!selectedFile} onOpenChange={() => setSelectedFile(null)} />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Media File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{fileToDelete?.original_filename}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => fileToDelete && handleDeleteFile(fileToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
