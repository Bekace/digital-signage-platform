"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Maximize,
  X,
  Clock,
  Loader2,
  AlertCircle,
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

  const currentItem = items[currentIndex]
  const currentMedia = currentItem?.media || currentItem?.media_file
  const itemDuration = (currentItem?.duration || 30) * 1000 // Convert to milliseconds

  // Reset when modal opens/closes or item changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(0)
      setIsPlaying(false)
      setProgress(0)
      setMediaError(false)
      setMediaLoading(true)
    } else {
      setIsPlaying(false)
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
  }, [currentIndex, itemDuration])

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

    setIsPlaying(!isPlaying)

    // Handle video/audio elements
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
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
  }

  const handleMediaError = () => {
    setMediaLoading(false)
    setMediaError(true)
    setIsPlaying(false)
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview - {playlist.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items to preview</h3>
              <p className="text-gray-500">Add some media files to your playlist first.</p>
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
      <DialogContent className={cn("max-w-6xl max-h-[95vh] p-0", isFullscreen && "max-w-full max-h-full")}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
              <DialogTitle className="text-lg font-semibold">Preview - {playlist.name}</DialogTitle>
              <Badge variant="outline">
                {currentIndex + 1} of {items.length}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Media Display */}
          <div
            className="flex-1 flex items-center justify-center relative"
            style={{ backgroundColor: playlist.background_color || "#000000" }}
          >
            {mediaLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}

            {mediaError && (
              <div className="text-center text-white">
                <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Media Error</h3>
                <p className="text-gray-300">Unable to load this media file</p>
                <p className="text-sm text-gray-400 mt-2">{currentMedia.original_name || currentMedia.filename}</p>
              </div>
            )}

            {/* Image Display */}
            {isImage && !mediaError && (
              <img
                src={currentMedia.url || "/placeholder.svg"}
                alt={currentMedia.original_name || currentMedia.filename}
                className={cn("max-w-full max-h-full", getScaleClass(currentMedia.mime_type))}
                onLoad={handleMediaLoad}
                onError={handleMediaError}
              />
            )}

            {/* Video Display */}
            {isVideo && !mediaError && (
              <video
                ref={videoRef}
                src={currentMedia.url}
                className={cn("max-w-full max-h-full", getScaleClass(currentMedia.mime_type))}
                muted={isMuted}
                onLoadedData={handleMediaLoad}
                onError={handleMediaError}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            {/* Audio Display */}
            {isAudio && !mediaError && (
              <div className="text-center text-white">
                <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
                  <Volume2 className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">{currentMedia.original_name || currentMedia.filename}</h3>
                  <p className="text-gray-300">Audio File</p>
                </div>
                <audio
                  ref={audioRef}
                  src={currentMedia.url}
                  onLoadedData={handleMediaLoad}
                  onError={handleMediaError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            )}

            {/* PDF Display */}
            {isPDF && !mediaError && (
              <div className="w-full h-full">
                <iframe
                  src={currentMedia.url}
                  className="w-full h-full border-0"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                  title={currentMedia.original_name || currentMedia.filename}
                />
              </div>
            )}

            {/* Presentation Display */}
            {isPresentation && !mediaError && (
              <div className="w-full h-full">
                <iframe
                  src={currentMedia.url}
                  className="w-full h-full border-0"
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                  title={currentMedia.original_name || currentMedia.filename}
                />
              </div>
            )}

            {/* Text Overlay */}
            {playlist.text_overlay && (
              <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-lg backdrop-blur-sm">
                <h4 className="font-medium">{currentMedia.original_name || currentMedia.filename}</h4>
                <p className="text-sm text-gray-300">
                  {currentMedia.file_type} • {formatTime(timeRemaining)} remaining
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t bg-white">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>{currentMedia.original_name || currentMedia.filename}</span>
                <span>{formatTime(timeRemaining)} remaining</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0 && !playlist.loop_enabled}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  variant={isPlaying ? "secondary" : "default"}
                  size="sm"
                  onClick={handlePlayPause}
                  disabled={mediaError}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === items.length - 1 && !playlist.loop_enabled}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                {(isVideo || isAudio) && (
                  <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{currentItem?.duration || 30}s per item</span>
                </div>
                {playlist.loop_enabled && (
                  <Badge variant="outline" className="text-xs">
                    Loop Enabled
                  </Badge>
                )}
                {playlist.shuffle && (
                  <Badge variant="outline" className="text-xs">
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
