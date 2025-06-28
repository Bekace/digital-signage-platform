"use client"

import type React from "react"
import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface UploadMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

export function UploadMediaDialog({ open, onOpenChange, onUploadComplete }: UploadMediaDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Basic file size check (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB")
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file")
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      setError(null)

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadProgress(100)
        onUploadComplete()
        onOpenChange(false)
        setSelectedFile(null)
        setError(null)
      } else {
        setError(data.error || "Failed to upload file")
      }
    } catch (err) {
      setError("Failed to upload file")
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false)
      setSelectedFile(null)
      setError(null)
      setUploadProgress(0)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upload Media</AlertDialogTitle>
          <AlertDialogDescription>Select a file to upload to your media library.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
            disabled={uploading}
          />
          {selectedFile && (
            <div className="text-sm text-gray-600">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <div className="text-sm text-gray-600 text-center">Uploading...</div>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={uploading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default UploadMediaDialog
