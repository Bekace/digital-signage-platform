"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, SkipBack, Maximize, Minimize, X } from "lucide-react"

interface PlaylistItem {
  id: number
  duration: number
  media: {
    id: number
    filename: string
    original_filename: string
    file_type: string
    url: string
  }
}

interface PlaylistPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: PlaylistItem[]
  playlistName: string
}

export function PlaylistPreviewModal({ open, onOpenChange, items, playlistName }: PlaylistPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentItem = items[currentIndex]
  const totalItems = items.length

  useEffect(() => {
    if (currentItem) {
      setTimeRemaining(currentItem.duration)
      setProgress(0)
    }
  }, [currentIndex, currentItem])

  useEffect(() => {
    if (isPlaying && currentItem) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100 / currentItem.duration
          setTimeRemaining(Math.max(0, currentItem.duration - Math.floor((newProgress / 100) * currentItem.duration)))

          if (newProgress >= 100) {
            nextItem()
            return 0
          }
          return newProgress
        })
      }, 1000)
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
  }, [isPlaying, currentItem])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)

    // Handle video/audio playback
    if (currentItem?.media.file_type.startsWith("video/") && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    } else if (currentItem?.media.file_type.startsWith("audio/") && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const nextItem = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      setCurrentIndex(0)
      setProgress(0)
    }
  }

  const prevItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    } else {
      setCurrentIndex(totalItems - 1)
      setProgress(0)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const renderMedia = () => {
    if (!currentItem) return null

    const { media } = currentItem
    const mediaUrl = media.url

    if (media.file_type.startsWith("image/")) {
      return (
        <img
          src={mediaUrl || "/placeholder.svg"}
          alt={media.original_filename}
          className="w-full h-full object-contain"
        />
      )
    }

    if (media.file_type.startsWith("video/")) {
      return (
        <video
          ref={videoRef}
          src={mediaUrl}
          className="w-full h-full object-contain"
          muted
          loop
          onLoadedData={() => {
            if (isPlaying && videoRef.current) {
              videoRef.current.play()
            }
          }}
        />
      )
    }

    if (media.file_type.startsWith("audio/")) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <audio
            ref={audioRef}
            src={mediaUrl}
            onLoadedData={() => {
              if (isPlaying && audioRef.current) {
                audioRef.current.play()
              }
            }}
          />
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🎵</div>
            <div className="text-xl font-medium">{media.original_filename}</div>
            <div className="text-gray-400 mt-2">Audio File</div>
          </div>
        </div>
      )
    }

    if (media.file_type === "application/pdf") {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-xl font-medium text-gray-800">{media.original_filename}</div>
            <div className="text-gray-600 mt-2">PDF Document</div>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <div className="text-xl font-medium text-gray-800">{media.original_filename}</div>
          <div className="text-gray-600 mt-2">{media.file_type}</div>
        </div>
      </div>
    )
  }

  if (!currentItem) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`p-0 border-0 ${isFullscreen ? "max-w-none w-screen h-screen" : "max-w-6xl w-[90vw] h-[80vh]"}`}
      >
        <div className="relative w-full h-full bg-black">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          {/* Media display area with 16:9 aspect ratio */}
          <div className={`relative ${isFullscreen ? "w-full h-full" : "w-full h-full"}`}>
            <div className={`${isFullscreen ? "w-full h-full" : "aspect-video w-full"} bg-black`}>{renderMedia()}</div>
          </div>

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            {/* Progress bar */}
            <div className="mb-4">
              <Progress value={progress} className="h-2 bg-white/20" />
              <div className="flex justify-between text-white text-sm mt-2">
                <span>{currentItem.media.original_filename}</span>
                <span>{timeRemaining}s remaining</span>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={prevItem}
                disabled={totalItems <= 1}
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-12 h-12"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={nextItem}
                disabled={totalItems <= 1}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Playlist info */}
            <div className="text-center text-white/80 text-sm mt-4">
              {playlistName} • Item {currentIndex + 1} of {totalItems}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
