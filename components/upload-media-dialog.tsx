"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, FileText, ImageIcon, Video, Loader2, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void // This callback should trigger refresh
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export function UploadMediaDialog({ open, onOpenChange, onUploadComplete }: UploadMediaDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }))
    setFiles((prev) => [...prev, ...uploadFiles])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    let hasSuccessfulUploads = false

    for (const uploadFile of files) {
      if (uploadFile.status !== "pending") continue

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f)),
        )

        const formData = new FormData()
        formData.append("file", uploadFile.file)

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (response.ok) {
          // Success
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "success" as const, progress: 100 } : f)),
          )
          hasSuccessfulUploads = true
        } else {
          // Error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: "error" as const, error: data.error || "Upload failed" } : f,
            ),
          )
        }
      } catch (error) {
        // Network error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "error" as const, error: "Network error. Please try again." } : f,
          ),
        )
      }
    }

    setIsUploading(false)

    // If any uploads were successful, trigger the callback
    if (hasSuccessfulUploads) {
      console.log("✅ Upload completed successfully, triggering refresh...")
      onUploadComplete() // This should trigger the refresh
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      onOpenChange(false)
    }
  }

  const allCompleted = files.length > 0 && files.every((f) => f.status === "success" || f.status === "error")
  const hasErrors = files.some((f) => f.status === "error")
  const hasSuccess = files.some((f) => f.status === "success")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Media Files</DialogTitle>
          <DialogDescription>
            Upload images, videos, and documents to your media library. Maximum file size: 10MB per file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to select</p>
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <Button variant="outline" asChild disabled={isUploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-3 p-2 border rounded">
                  <div className="flex-shrink-0">{getFileIcon(uploadFile.file)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                    {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="mt-1 h-1" />}
                    {uploadFile.status === "error" && <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>}
                    {uploadFile.status === "success" && <p className="text-xs text-green-600 mt-1">Uploaded!</p>}
                  </div>
                  {uploadFile.status === "pending" && !isUploading && (
                    <Button variant="ghost" size="sm" onClick={() => removeFile(uploadFile.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {uploadFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {uploadFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                </div>
              ))}
            </div>
          )}

          {/* Status Messages */}
          {allCompleted && hasSuccess && (
            <Alert>
              <AlertDescription>
                {hasErrors ? "Some files uploaded successfully. " : "All files uploaded successfully! "}
                The media library will be updated automatically.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {allCompleted ? "Close" : "Cancel"}
          </Button>
          {files.length > 0 && !allCompleted && (
            <Button onClick={uploadFiles} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.filter((f) => f.status === "pending").length} Files
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
