"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Clock,
  Loader2,
  AlertCircle,
  Tv,
  Maximize,
  Minimize,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaFile {
  id: number
  filename: string
  original_filename?: string
  original_name?: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  mime_type?: string
  dimensions?: string
  duration?: number
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_id: number
  position: number
  duration?: number
  transition_type: string
  media?: MediaFile
  media_file?: MediaFile
}

interface Playlist {
  id: number
  name: string
  description?: string
  status: string
  loop_enabled: boolean
  schedule_enabled: boolean
  start_time?: string
  end_time?: string
  selected_days: string[]
  scale_image: string
  scale_video: string
  scale_document: string
  shuffle: boolean
  default_transition: string
  transition_speed: string
  auto_advance: boolean
  background_color: string
  text_overlay: boolean
}

interface PlaylistPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: Playlist
  items: PlaylistItem[]
}

export function PlaylistPreviewModal({ open, onOpenChange, playlist, items }: PlaylistPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [mediaError, setMediaError] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)

  const currentItem = items[currentIndex]
  const currentMedia = currentItem?.media || currentItem?.media_file
  const itemDuration = (currentItem?.duration || 30) * 1000 // Convert to milliseconds

  // Reset when modal opens/closes or item changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(0)
      setIsPlaying(true) // Auto-start playing when modal opens
      setProgress(0)
      setMediaError(false)
      setMediaLoading(true)
      setIsFullscreen(false)
    } else {
      setIsPlaying(false)
      setIsFullscreen(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [open])

  useEffect(() => {
    setProgress(0)
    setMediaError(false)
    setMediaLoading(true)
    setTimeRemaining(itemDuration)

    // Auto-play when item changes (if we were already playing)
    if (open && isPlaying) {
      // Small delay to let media load
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0
          videoRef.current.play().catch(console.error)
        }
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(console.error)
        }
      }, 100)
    }
  }, [currentIndex, itemDuration, open])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Handle auto-advance and progress
  useEffect(() => {
    if (isPlaying && !mediaError) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100 / (itemDuration / 100)

          if (newProgress >= 100) {
            // Auto-advance to next item
            if (currentIndex < items.length - 1) {
              setCurrentIndex(currentIndex + 1)
              return 0
            } else if (playlist.loop_enabled) {
              setCurrentIndex(0)
              return 0
            } else {
              setIsPlaying(false)
              return 100
            }
          }

          setTimeRemaining(Math.max(0, itemDuration - (newProgress / 100) * itemDuration))
          return newProgress
        })
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentIndex, items.length, playlist.loop_enabled, itemDuration, mediaError])

  const handlePlayPause = () => {
    if (mediaError) return

    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)

    // Handle video/audio elements
    if (videoRef.current) {
      if (newPlayingState) {
        videoRef.current.play().catch(console.error)
      } else {
        videoRef.current.pause()
      }
    }

    if (audioRef.current) {
      if (newPlayingState) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (playlist.loop_enabled) {
      setCurrentIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else if (playlist.loop_enabled) {
      setCurrentIndex(items.length - 1)
    }
  }

  const handleMediaLoad = () => {
    setMediaLoading(false)
    setMediaError(false)

    // Auto-play video/audio when loaded if we're in playing state
    if (isPlaying) {
      if (videoRef.current) {
        videoRef.current.play().catch(console.error)
      }
      if (audioRef.current) {
        audioRef.current.play().catch(console.error)
      }
    }
  }

  const handleMediaError = () => {
    setMediaLoading(false)
    setMediaError(true)
    setIsPlaying(false)
  }

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return

    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getScaleClass = (mediaType: string) => {
    if (mediaType?.startsWith("image/")) {
      return playlist.scale_image === "fill"
        ? "object-cover"
        : playlist.scale_image === "fit"
          ? "object-contain"
          : "object-scale-down"
    }
    if (mediaType?.startsWith("video/")) {
      return playlist.scale_video === "fill"
        ? "object-cover"
        : playlist.scale_video === "fit"
          ? "object-contain"
          : "object-scale-down"
    }
    return "object-contain"
  }

  if (!currentMedia) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl p-0 bg-gray-900">
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-white">Preview - {playlist.name}</h2>
                <Badge variant="outline" className="text-gray-300 border-gray-600">
                  No items
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No items to preview</h3>
                <p className="text-gray-400">Add some media files to your playlist first.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isImage = currentMedia.mime_type?.startsWith("image/") || currentMedia.file_type === "image"
  const isVideo = currentMedia.mime_type?.startsWith("video/") || currentMedia.file_type === "video"
  const isAudio = currentMedia.mime_type?.startsWith("audio/")
  const isPDF = currentMedia.mime_type === "application/pdf" || currentMedia.file_type === "document"
  const isPresentation = currentMedia.file_type === "presentation"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("p-0 bg-gray-900 border-gray-700", isFullscreen ? "max-w-none w-screen h-screen" : "max-w-none")}
        style={isFullscreen ? {} : { width: "fit-content" }}
      >
        <div ref={fullscreenRef} className="flex flex-col h-full">
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800",
              isFullscreen && "absolute top-0 left-0 right-0 z-50 bg-gray-800/90 backdrop-blur-sm",
            )}
          >
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-white">Digital Signage Preview</h2>
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                {currentIndex + 1} of {items.length}
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1 bg-blue-600 text-white">
                <Tv className="h-3 w-3" />
                <span>1920×1080</span>
              </Badge>
              {isFullscreen && (
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Fullscreen Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-gray-300 hover:text-white">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fixed 1920x1080 TV Screen Simulation */}
          <div className={cn("flex items-center justify-center bg-gray-900", isFullscreen ? "flex-1 pt-16" : "p-6")}>
            <div
              className="relative border-4 border-gray-700 shadow-2xl"
              style={
                isFullscreen
                  ? {
                      width: "100vw",
                      height: "calc(100vh - 8rem)",
                      maxWidth: "calc((100vh - 8rem) * 16 / 9)",
                      backgroundColor: playlist.background_color || "#000000",
                    }
                  : {
                      width: "960px", // Fixed width (1920px scaled down by 50%)
                      height: "540px", // Fixed height (1080px scaled down by 50%)
                      backgroundColor: playlist.background_color || "#000000",
                    }
              }
            >
              {/* Screen bezel effect */}
              <div className="absolute -inset-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg -z-10"></div>

              {mediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}

              {mediaError && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                  <div className="text-center">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Media Error</h3>
                    <p className="text-gray-300">Unable to load this media file</p>
                    <p className="text-sm text-gray-400 mt-2">{currentMedia.original_name || currentMedia.filename}</p>
                  </div>
                </div>
              )}

              {/* Image Display */}
              {isImage && !mediaError && (
                <img
                  src={currentMedia.url || "/placeholder.svg"}
                  alt={currentMedia.original_name || currentMedia.filename}
                  className={cn("w-full h-full", getScaleClass(currentMedia.mime_type))}
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                />
              )}

              {/* Video Display */}
              {isVideo && !mediaError && (
                <video
                  ref={videoRef}
                  src={currentMedia.url}
                  className={cn("w-full h-full", getScaleClass(currentMedia.mime_type))}
                  muted={isMuted}
                  autoPlay={isPlaying}
                  loop={false}
                  onLoadedData={handleMediaLoad}
                  onError={handleMediaError}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={() => {
                    // Video ended naturally, advance to next
                    handleNext()
                  }}
                />
              )}

              {/* Audio Display */}
              {isAudio && !mediaError && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
                      <Volume2 className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-xl font-medium mb-2">
                        {currentMedia.original_name || currentMedia.filename}
                      </h3>
                      <p className="text-gray-300">Audio File</p>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={currentMedia.url}
                    autoPlay={isPlaying}
                    muted={isMuted}
                    onLoadedData={handleMediaLoad}
                    onError={handleMediaError}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onEnded={() => {
                      // Audio ended naturally, advance to next
                      handleNext()
                    }}
                  />
                </div>
              )}

              {/* PDF Display */}
              {isPDF && !mediaError && (
                <iframe
                  src={currentMedia.url}
                  className="w-full h-full border-0"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                  title={currentMedia.original_name || currentMedia.filename}
                />
              )}

              {/* Presentation Display */}
              {isPresentation && !mediaError && (
                <iframe
                  src={currentMedia.url}
                  className="w-full h-full border-0"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                  title={currentMedia.original_name || currentMedia.filename}
                />
              )}

              {/* Text Overlay */}
              {playlist.text_overlay && !mediaError && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
                  <h4 className="font-medium">{currentMedia.original_name || currentMedia.filename}</h4>
                  <p className="text-sm text-gray-300">
                    {currentMedia.file_type} • {formatTime(timeRemaining)} remaining
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div
            className={cn(
              "p-4 border-t border-gray-700 bg-gray-800",
              isFullscreen && "absolute bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm",
            )}
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                <span className="truncate max-w-md">{currentMedia.original_name || currentMedia.filename}</span>
                <span>{formatTime(timeRemaining)} remaining</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-700" />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0 && !playlist.loop_enabled}
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 bg-transparent"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  variant={isPlaying ? "secondary" : "default"}
                  size="sm"
                  onClick={handlePlayPause}
                  disabled={mediaError}
                  className={isPlaying ? "bg-gray-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === items.length - 1 && !playlist.loop_enabled}
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 bg-transparent"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                {(isVideo || isAudio) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{currentItem?.duration || 30}s per item</span>
                </div>
                {playlist.loop_enabled && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    Loop Enabled
                  </Badge>
                )}
                {playlist.shuffle && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    Shuffle
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
