"use client"

import { useState } from "react"
import { Plus, Play, MoreHorizontal, Edit, Trash2, Copy, Clock, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"

const playlists = [
  {
    id: 1,
    name: "Welcome Messages",
    description: "Greeting messages for lobby display",
    items: 5,
    duration: "8:30",
    status: "active",
    screens: ["Lobby Display", "Reception Desk"],
    lastModified: "2024-01-15",
  },
  {
    id: 2,
    name: "Menu & Announcements",
    description: "Daily menu and company announcements",
    items: 8,
    duration: "12:45",
    status: "active",
    screens: ["Cafeteria TV"],
    lastModified: "2024-01-14",
  },
  {
    id: 3,
    name: "Meeting Schedule",
    description: "Conference room booking information",
    items: 3,
    duration: "5:00",
    status: "scheduled",
    screens: ["Conference Room A"],
    lastModified: "2024-01-13",
  },
  {
    id: 4,
    name: "Company Info",
    description: "Company overview and values",
    items: 6,
    duration: "10:15",
    status: "draft",
    screens: [],
    lastModified: "2024-01-12",
  },
  {
    id: 5,
    name: "Product Showcase",
    description: "Latest products and services",
    items: 4,
    duration: "7:20",
    status: "active",
    screens: ["Lobby Display"],
    lastModified: "2024-01-11",
  },
]

export default function PlaylistsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-gray-600">Create and manage content playlists for your screens</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlists.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {playlists.filter((p) => p.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {playlists.filter((p) => p.status === "scheduled").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {playlists.filter((p) => p.status === "draft").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playlists Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <CardTitle className="text-lg">{playlist.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>{playlist.description}</CardDescription>

                <div className="flex justify-between items-center">
                  <Badge className={getStatusColor(playlist.status)}>
                    {playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span>{playlist.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{playlist.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Screens:</span>
                    <span>{playlist.screens.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modified:</span>
                    <span>{playlist.lastModified}</span>
                  </div>
                </div>

                {playlist.screens.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Active on:</div>
                    <div className="flex flex-wrap gap-1">
                      {playlist.screens.map((screen, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Monitor className="h-3 w-3 mr-1" />
                          {screen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" className="flex-1">
                    {playlist.status === "draft" ? "Publish" : "Preview"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <CreatePlaylistDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    </DashboardLayout>
  )
}
