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
import { canUploadFile } from "@/lib/plans"

interface UploadMediaDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onFileUploaded: (file: File) => void
}

const UploadMediaDialog: React.FC<UploadMediaDialogProps> = ({ open, setOpen, onFileUploaded }) => {
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
    if (!file || !planData) return

    // Check plan limits before setting file
    const uploadCheck = canUploadFile(planData.usage, planData.limits, file.size)

    if (!uploadCheck.allowed) {
      setError(uploadCheck.reason || "Upload not allowed")
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
          <Input type="file" onChange={handleFileSelect} />
          {error && <p className="text-red-500">{error}</p>}
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
