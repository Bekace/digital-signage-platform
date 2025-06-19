import Link from "next/link"
import { ArrowRight, Monitor, Play, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Monitor className="h-6 w-6 mr-2" />
          <span className="font-bold">SignageCloud</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Digital Signage Made Simple
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Manage your digital displays, upload content, create playlists, and control multiple screens from one
                powerful platform.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/signup">
                <Button size="lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Everything You Need</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl mt-4">
              Powerful features to manage your digital signage network efficiently
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <Card>
              <CardHeader>
                <Monitor className="h-10 w-10 mb-2" />
                <CardTitle>Screen Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Add and manage multiple screens, monitor their status, and control content remotely.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Upload className="h-10 w-10 mb-2" />
                <CardTitle>Media Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Upload images, videos, and documents. Organize your content with tags and folders.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Play className="h-10 w-10 mb-2" />
                <CardTitle>Playlist Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Create dynamic playlists, schedule content, and set display durations for each item.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 SignageCloud. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
