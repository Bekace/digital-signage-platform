"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UploadMediaDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onFileUploaded: (file: File) => void
}

export function UploadMediaDialog({ open, setOpen, onFileUploaded }: UploadMediaDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [planData, setPlanData] = useState<any>(null)

  const fetchPlanData = async () => {
    try {
      const response = await fetch("/api/user/plan")
      if (response.ok) {
        const data = await response.json()
        setPlanData(data)
      }
    } catch (error) {
      console.error("Error fetching plan data:", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPlanData()
    }
  }, [open])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Basic file size check (100MB limit for demo)
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB")
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleUpload = () => {
    if (selectedFile) {
      onFileUploaded(selectedFile)
      setOpen(false)
      setSelectedFile(null)
      setError(null)
    } else {
      setError("Please select a file")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Upload Media</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upload Media</AlertDialogTitle>
          <AlertDialogDescription>Select a file to upload to the server.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <Input type="file" onChange={handleFileSelect} accept="image/*,video/*,.pdf" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpload} disabled={!selectedFile}>
            Upload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default UploadMediaDialog
