"use client"

import { useState } from "react"
import Image from "next/image"
import { Upload, Search, Filter, MoreHorizontal, Download, Trash2, Eye, Video, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UploadMediaDialog } from "@/components/upload-media-dialog"
import { UsageDashboard } from "@/components/usage-dashboard"

const mediaFiles = [
  {
    id: 1,
    name: "summer-promo.mp4",
    type: "video",
    size: "45.2 MB",
    duration: "2:30",
    uploadDate: "2024-01-15",
    thumbnail: "/placeholder.svg?height=100&width=150",
  },
  {
    id: 2,
    name: "company-logo.png",
    type: "image",
    size: "2.1 MB",
    dimensions: "1920x1080",
    uploadDate: "2024-01-14",
    thumbnail: "/placeholder.svg?height=100&width=150",
  },
  {
    id: 3,
    name: "menu-board.jpg",
    type: "image",
    size: "3.8 MB",
    dimensions: "1366x768",
    uploadDate: "2024-01-13",
    thumbnail: "/placeholder.svg?height=100&width=150",
  },
  {
    id: 4,
    name: "announcement.pdf",
    type: "document",
    size: "1.2 MB",
    pages: "3 pages",
    uploadDate: "2024-01-12",
    thumbnail: "/placeholder.svg?height=100&width=150",
  },
  {
    id: 5,
    name: "product-showcase.mp4",
    type: "video",
    size: "78.5 MB",
    duration: "4:15",
    uploadDate: "2024-01-11",
    thumbnail: "/placeholder.svg?height=100&width=150",
  },
  {
    id: 6,
    name: "weather-widget.png",
    type: "image",
    size: "0.8 MB",
    dimensions: "800x600",
    uploadDate: "2024-01-10",
    thumbnail: "/placeholder.svg?height=100&width=150",
  },
]

export default function MediaPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const getFileIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "image":
        return <Image className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-blue-100 text-blue-800"
      case "image":
        return "bg-green-100 text-green-800"
      case "document":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
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

        {/* Media Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mediaFiles.map((file) => (
            <Card key={file.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={file.thumbnail || "/placeholder.svg"}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg bg-gray-100"
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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
                      <Badge className={`${getFileTypeColor(file.type)} text-xs`}>
                        {getFileIcon(file.type)}
                        <span className="ml-1 capitalize">{file.type}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{file.size}</span>
                      </div>
                      {file.duration && (
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{file.duration}</span>
                        </div>
                      )}
                      {file.dimensions && (
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{file.dimensions}</span>
                        </div>
                      )}
                      {file.pages && (
                        <div className="flex justify-between">
                          <span>Pages:</span>
                          <span>{file.pages}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Uploaded:</span>
                        <span>{file.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <UploadMediaDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
      </div>
    </DashboardLayout>
  )
}
