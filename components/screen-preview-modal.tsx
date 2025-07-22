"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize,
  Volume2,
  Clock,
  FileText,
  ExternalLink,
  Monitor,
  Wifi,
  WifiOff,
} from "lucide-react"

interface MediaFile {
  id: number
  filename: string
  original_name?: string
  original_filename?: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  mime_type?: string
  dimensions?: string
  duration?: number
  media_source?: string
  external_url?: string
  embed_settings?: string | object
  created_at: string
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_id: number
  position: number
  duration?: number
  transition_type: string
  created_at: string
  media?: MediaFile
  media_file?: MediaFile
}

interface Playlist {
  id: number
  name: string
  description?: string
  status: string
  loop_enabled: boolean
  shuffle: boolean
  default_transition: string
  transition_speed: string
  auto_advance: boolean
  background_color: string
  text_overlay: boolean
  items?: PlaylistItem[]
}

interface Device {
  id: string
  name: string
  device_type: string
  status: string
  last_seen?: string
  created_at: string
  assigned_playlist_id?: number
  assigned_playlist_name?: string
  playlist_status?: string
  platform?: string
  screen_resolution?: string
  capabilities?: string[]
}

interface ScreenPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device
}

export function ScreenPreviewModal({ open, onOpenChange, device }: ScreenPreviewModalProps) {
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [iframeError, setIframeError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Safely get current item and media
  const currentItem =
    currentPlaylist?.items && currentPlaylist.items.length > 0 ? currentPlaylist.items[currentIndex] : null
  const mediaFile = currentItem ? currentItem.media || currentItem.media_file : null

  // Load device playlist
  const loadDevicePlaylist = useCallback(async () => {
    if (!device.assigned_playlist_id) {
      setCurrentPlaylist(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError("")

      // Get playlist details
      const playlistResponse = await fetch(`/api/playlists/${device.assigned_playlist_id}`, {
        credentials: "include",
      })

      if (!playlistResponse.ok) {
        throw new Error("Failed to load playlist")
      }

      const playlistData = await playlistResponse.json()

      if (!playlistData.success) {
        throw new Error(playlistData.error || "Failed to load playlist")
      }

      // Get playlist items
      const itemsResponse = await fetch(`/api/playlists/${device.assigned_playlist_id}/items`, {
        credentials: "include",
      })

      if (!itemsResponse.ok) {
        throw new Error("Failed to load playlist items")
      }

      const itemsData = await itemsResponse.json()

      if (!itemsData.success) {
        throw new Error(itemsData.error || "Failed to load playlist items")
      }

      setCurrentPlaylist({
        ...playlistData.playlist,
        items: itemsData.items || [],
      })

      // Auto-start if there are items
      if (itemsData.items && itemsData.items.length > 0) {
        setIsPlaying(true)
      }
    } catch (err) {
      console.error("Error loading device playlist:", err)
      setError(err instanceof Error ? err.message : "Failed to load playlist")
    } finally {
      setLoading(false)
    }
  }, [device.assigned_playlist_id])

  // Load playlist when modal opens
  useEffect(() => {
    if (open) {
      loadDevicePlaylist()
    } else {
      // Reset state when modal closes
      setCurrentPlaylist(null)
      setCurrentIndex(0)
      setIsPlaying(false)
      setProgress(0)
      setError("")
      setIframeError(false)
      setVideoError(false)
      setImageError(false)
    }
  }, [open, loadDevicePlaylist])

  // Safe function to get embed settings
  const getEmbedSettings = useCallback((embedSettings?: string | object) => {
    if (!embedSettings) return {}

    if (typeof embedSettings === "object") {
      return embedSettings
    }

    try {
      return JSON.parse(embedSettings)
    } catch (error) {
      console.error("Failed to parse embed_settings:", error)
      return {}
    }
  }, [])

  // Function to convert Google Slides URL to embeddable format
  const getEmbedUrl = useCallback((url: string) => {
    if (!url) return url

    try {
      // Handle different Google Slides URL formats
      if (url.includes("/presentation/d/")) {
        // Extract the presentation ID
        const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)
        if (match) {
          const presentationId = match[1]
          // Return embed URL with autoplay
          return `https://docs.google.com/presentation/d/${presentationId}/embed?start=true&loop=true&delayms=5000`
        }
      }

      // If it's already an embed URL, return as is
      if (url.includes("/embed")) {
        return url
      }

      // Fallback: try to convert any Google Slides URL
      return url.replace("/edit", "/embed?start=true&loop=true&delayms=5000")
    } catch (error) {
      console.error("Error converting URL to embed format:", error)
      return url
    }
  }, [])

  const isSlidesFile = useCallback((file: MediaFile | null) => {
    if (!file) return false
    return file.media_source === "google_slides" || file.file_type === "presentation" || file.mime_type === "text/html"
  }, [])

  const isVideoFile = useCallback((file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.startsWith("video/") || file.mime_type?.startsWith("video/")
  }, [])

  const isImageFile = useCallback((file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.startsWith("image/") || file.mime_type?.startsWith("image/")
  }, [])

  const isAudioFile = useCallback((file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.startsWith("audio/") || file.mime_type?.startsWith("audio/")
  }, [])

  const isPDFFile = useCallback((file: MediaFile | null) => {
    if (!file) return false
    return file.file_type?.includes("pdf") || file.mime_type?.includes("pdf")
  }, [])

  // Auto-advance logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying && currentItem && mediaFile && currentPlaylist?.items && currentPlaylist.items.length > 0) {
      const itemDuration = (currentItem.duration || 30) * 1000 // Convert to milliseconds
      const updateInterval = 100 // Update every 100ms for smooth progress

      // For videos and audio, we handle advancement differently
      if (isVideoFile(mediaFile) || isAudioFile(mediaFile)) {
        // Video/Audio advancement is handled by onEnded event, not timer
        return
      }

      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (updateInterval / itemDuration) * 100

          if (newProgress >= 100) {
            // Auto-advance to next item
            if (currentIndex < currentPlaylist.items!.length - 1) {
              setCurrentIndex(currentIndex + 1)
              setProgress(0)
              // Reset error states
              setIframeError(false)
              setVideoError(false)
              setImageError(false)
            } else if (currentPlaylist.loop_enabled) {
              setCurrentIndex(0)
              setProgress(0)
              // Reset error states
              setIframeError(false)
              setVideoError(false)
              setImageError(false)
            } else {
              setIsPlaying(false)
              return 100
            }
            return 0
          }
          return newProgress
        })
      }, updateInterval)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying, currentIndex, currentItem, mediaFile, currentPlaylist, isVideoFile, isAudioFile])

  // Reset errors when item changes
  useEffect(() => {
    setIframeError(false)
    setVideoError(false)
    setImageError(false)
    setProgress(0)
  }, [currentIndex])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleNext = useCallback(() => {
    if (!currentPlaylist?.items) return

    if (currentIndex < currentPlaylist.items.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else if (currentPlaylist.loop_enabled) {
      setCurrentIndex(0)
      setProgress(0)
    }
  }, [currentIndex, currentPlaylist])

  const handlePrevious = useCallback(() => {
    if (!currentPlaylist?.items) return

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    } else if (currentPlaylist.loop_enabled) {
      setCurrentIndex(currentPlaylist.items.length - 1)
      setProgress(0)
    }
  }, [currentIndex, currentPlaylist])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const handleVideoEnded = useCallback(() => {
    console.log("🎬 [SCREEN PREVIEW] Video/Audio ended, advancing to next item")
    setProgress(100)

    // Auto-advance after video/audio ends
    setTimeout(() => {
      if (!currentPlaylist?.items) return

      if (currentIndex < currentPlaylist.items.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setProgress(0)
      } else if (currentPlaylist.loop_enabled) {
        setCurrentIndex(0)
        setProgress(0)
      } else {
        setIsPlaying(false)
      }
    }, 500) // Small delay for smooth transition
  }, [currentIndex, currentPlaylist])

  const handleVideoError = useCallback(
    (e: any) => {
      console.error("🎬 [SCREEN PREVIEW] Video failed to load:", mediaFile?.url, e)
      setVideoError(true)
    },
    [mediaFile?.url],
  )

  const handleImageError = useCallback(() => {
    console.error("🎬 [SCREEN PREVIEW] Image failed to load:", mediaFile?.url)
    setImageError(true)
  }, [mediaFile?.url])

  const handleIframeError = useCallback(() => {
    console.error("🎬 [SCREEN PREVIEW] Iframe failed to load:", mediaFile?.url)
    setIframeError(true)
  }, [mediaFile?.url])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  const getFileTypeLabel = useCallback((fileType: string, mediaSource?: string) => {
    if (mediaSource === "google_slides") return "Google Slides"
    if (fileType?.startsWith("image/")) return "Image"
    if (fileType?.startsWith("video/")) return "Video"
    if (fileType?.includes("pdf")) return "PDF"
    if (fileType?.startsWith("audio/")) return "Audio"
    if (fileType?.includes("presentation")) return "Slides"
    return "File"
  }, [])

  const getStatusIcon = () => {
    switch (device.status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />
    }
  }

  // Handle loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {device.name} - Screen Preview
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading screen content...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {device.name} - Screen Preview
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg inline-block">
              <div className="text-red-600 mb-2">Error loading screen content</div>
              <p className="text-red-700 text-sm">{error}</p>
              <Button onClick={loadDevicePlaylist} className="mt-4" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Handle no playlist assigned
  if (!device.assigned_playlist_id || !currentPlaylist) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {device.name} - Screen Preview
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Monitor className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Content Assigned</h3>
            <p className="text-gray-600 mb-4">This screen doesn't have a playlist assigned yet.</p>
            <p className="text-sm text-gray-500">Assign a playlist to this screen to see preview content.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Handle empty playlist
  if (!currentPlaylist.items || currentPlaylist.items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {device.name} - Screen Preview
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Empty Playlist</h3>
            <p className="text-gray-600 mb-2">The assigned playlist "{currentPlaylist.name}" has no media files.</p>
            <p className="text-sm text-gray-500">Add media files to the playlist to see preview content.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isFullscreen ? "max-w-full max-h-full w-screen h-screen" : "max-w-5xl max-h-[90vh]"}`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <span>{device.name} - Screen Preview</span>
              {getStatusIcon()}
              <Badge variant={device.status === "online" ? "default" : "secondary"} className="capitalize">
                {device.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {currentIndex + 1} of {currentPlaylist.items.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleFullscreen}>
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-4">
              <span>
                <strong>Playlist:</strong> {currentPlaylist.name}
              </span>
              <span>
                <strong>Resolution:</strong> {device.screen_resolution || "Unknown"}
              </span>
              <span>
                <strong>Platform:</strong> {device.platform || "Unknown"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {currentPlaylist.loop_enabled && (
                <Badge variant="outline" className="text-xs">
                  Loop
                </Badge>
              )}
              {currentPlaylist.shuffle && (
                <Badge variant="outline" className="text-xs">
                  Shuffle
                </Badge>
              )}
            </div>
          </div>

          {/* Media Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
            {isSlidesFile(mediaFile) ? (
              // Google Slides Preview
              <div className="w-full h-full relative">
                {!iframeError ? (
                  <>
                    <iframe
                      src={getEmbedUrl(mediaFile.external_url || mediaFile.url)}
                      className="w-full h-full border-0"
                      frameBorder="0"
                      allowFullScreen
                      title={mediaFile.original_name || mediaFile.filename}
                      onLoad={() => {
                        console.log("🎬 [SCREEN PREVIEW] Google Slides iframe loaded successfully")
                        setIframeError(false)
                      }}
                      onError={handleIframeError}
                    />
                    {/* Overlay button for opening in Google Slides */}
                    <div className="absolute bottom-4 right-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          window.open(mediaFile.external_url || mediaFile.url, "_blank")
                        }}
                        className="bg-white/90 hover:bg-white text-gray-900"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Google Slides
                      </Button>
                    </div>
                  </>
                ) : (
                  // Fallback for iframe errors
                  <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 border border-blue-200 text-gray-600">
                    <svg className="h-16 w-16 text-blue-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Google Slides Presentation</h3>
                    <p className="text-gray-600 mb-4 text-center max-w-md">
                      {mediaFile.original_name || mediaFile.original_filename || mediaFile.filename}
                    </p>
                    <p className="text-gray-600 mb-4">Unable to embed presentation. Click to view in Google Slides.</p>
                    <Button
                      onClick={() => {
                        window.open(mediaFile.external_url || mediaFile.url, "_blank")
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Google Slides
                    </Button>
                  </div>
                )}
              </div>
            ) : isImageFile(mediaFile) ? (
              !imageError ? (
                <img
                  src={mediaFile.url || "/placeholder.svg"}
                  alt={mediaFile.original_name || mediaFile.filename}
                  className="w-full h-full object-contain"
                  onError={handleImageError}
                  onLoad={() => console.log("🎬 [SCREEN PREVIEW] Image loaded successfully")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-50 border border-red-200">
                  <div className="text-center text-gray-600">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-red-400" />
                    <h3 className="text-lg font-medium text-red-900 mb-2">Image Load Error</h3>
                    <p className="text-red-700 mb-4">Unable to load image preview</p>
                    <p className="text-sm mt-2">{mediaFile.original_name || mediaFile.filename}</p>
                  </div>
                </div>
              )
            ) : isVideoFile(mediaFile) ? (
              !videoError ? (
                <video
                  src={mediaFile.url}
                  className="w-full h-full object-contain"
                  controls
                  muted
                  autoPlay={isPlaying}
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                  onLoadedData={() => console.log("🎬 [SCREEN PREVIEW] Video loaded successfully")}
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-50 border border-red-200">
                  <div className="text-center text-gray-600">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-red-400" />
                    <h3 className="text-lg font-medium text-red-900 mb-2">Video Load Error</h3>
                    <p className="text-red-700 mb-4">Unable to load video preview</p>
                    <p className="text-sm mt-2">{mediaFile.original_name || mediaFile.filename}</p>
                  </div>
                </div>
              )
            ) : isAudioFile(mediaFile) ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <Volume2 className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">{mediaFile.original_name || mediaFile.filename}</h3>
                  <audio
                    src={mediaFile.url}
                    controls
                    autoPlay={isPlaying}
                    className="mt-4"
                    onEnded={handleVideoEnded}
                  />
                </div>
              </div>
            ) : isPDFFile(mediaFile) ? (
              <iframe
                src={`${mediaFile.url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title={mediaFile.original_name || mediaFile.filename}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-600">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">{mediaFile.original_name || mediaFile.filename}</h3>
                  <p className="text-sm mt-2">{getFileTypeLabel(mediaFile.file_type, mediaFile.media_source)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="w-full" />

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0 && !currentPlaylist.loop_enabled}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              {isPlaying ? (
                <Button variant="ghost" size="sm" onClick={handlePause}>
                  <Pause className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handlePlay}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === currentPlaylist.items.length - 1 && !currentPlaylist.loop_enabled}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{currentItem.duration || 30}s</span>
              </div>
              <Badge variant="secondary">{getFileTypeLabel(mediaFile.file_type, mediaFile.media_source)}</Badge>
              <span>{formatFileSize(mediaFile.file_size)}</span>
            </div>
          </div>

          {/* Current Item Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  {mediaFile.thumbnail_url ? (
                    <img
                      src={mediaFile.thumbnail_url || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {mediaFile.original_name || mediaFile.original_filename || mediaFile.filename}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {currentItem.transition_type}
                    </Badge>
                    <span>Position {currentItem.position}</span>
                    {mediaFile.media_source === "google_slides" && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Auto-advance
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
