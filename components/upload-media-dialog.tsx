"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, CheckCircle, AlertCircle, File, ImageIcon, Video, FileText } from "lucide-react"

interface UploadMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
  response?: any
}

export function UploadMediaDialog({ open, onOpenChange, onUploadComplete }: UploadMediaDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    console.log(
      "📁 Files selected:",
      selectedFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    )

    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }))
    setFiles(newFiles)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    console.log(
      "📁 Files dropped:",
      droppedFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    )

    const newFiles: UploadFile[] = droppedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending",
    }))
    setFiles(newFiles)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const removeFile = (id: string) => {
    setFiles(files.filter((_, i) => files.findIndex((f) => f.id === id) !== i))
  }

  const uploadFiles = async () => {
    setIsUploading(true)

    for (const uploadFile of files) {
      if (uploadFile.status !== "pending") continue

      try {
        console.log("🚀 Uploading file:", {
          name: uploadFile.file.name,
          type: uploadFile.file.type,
          size: uploadFile.file.size,
        })

        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f)),
        )

        const formData = new FormData()
        formData.append("file", uploadFile.file)

        console.log("📤 Sending FormData with file:", uploadFile.file.name)

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        console.log("📥 Upload response:", { status: response.status, result })

        if (response.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: "success" as const, progress: 100, response: result } : f,
            ),
          )
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "error" as const,
                    error: result.message || result.error || JSON.stringify(result),
                    response: result,
                  }
                : f,
            ),
          )
        }
      } catch (error) {
        console.error("❌ Upload error:", error)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        )
      }
    }

    setIsUploading(false)

    // Call completion callback if any files succeeded
    const hasSuccessful = files.some((f) => f.status === "success")
    if (hasSuccessful && onUploadComplete) {
      onUploadComplete()
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />
    if (file.type === "application/pdf") return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Media Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500">Supports: JPG, PNG, GIF, MP4, WebM, PDF (Max 100MB per file)</p>
            </div>
            <Input
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" className="mt-4" asChild>
                <span>Browse Files</span>
              </Button>
            </Label>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Selected Files ({files.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((uploadFile) => (
                  <div key={uploadFile.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 flex-1">
                      {getFileIcon(uploadFile.file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type || "Unknown type"}
                        </p>
                        {uploadFile.status === "uploading" && <Progress value={uploadFile.progress} className="mt-1" />}
                        {uploadFile.status === "error" && (
                          <div className="mt-2">
                            <Alert className="border-red-200">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                <div className="font-medium">Upload failed:</div>
                                <div>{uploadFile.error}</div>
                                {uploadFile.response && (
                                  <details className="mt-1">
                                    <summary className="cursor-pointer text-xs">Debug info</summary>
                                    <pre className="text-xs mt-1 bg-gray-50 p-2 rounded overflow-auto">
                                      {JSON.stringify(uploadFile.response, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                        {uploadFile.status === "success" && (
                          <div className="mt-1 text-xs text-green-600">✅ Upload successful</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {uploadFile.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {uploadFile.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {uploadFile.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {files.some((f) => f.status === "success") ? "Done" : "Cancel"}
            </Button>
            {files.length > 0 && files.some((f) => f.status === "pending") && (
              <Button onClick={uploadFiles} disabled={isUploading}>
                {isUploading ? "Uploading..." : `Upload ${files.filter((f) => f.status === "pending").length} Files`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
