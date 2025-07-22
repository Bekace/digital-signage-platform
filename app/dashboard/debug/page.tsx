import { ArrowRight, Code, Compass, FileCode, FlaskConical, Monitor, Terminal, Wand2 } from "lucide-react"

import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Debug",
  description: "Debug tools for the application.",
}

const debugLinks = [
  {
    name: "AI Playground",
    description: "Experiment with AI models",
    href: "/ai/playground",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    name: "Components",
    description: "Re-usable components built using Radix UI and Tailwind CSS.",
    href: "/components",
    icon: <Code className="h-5 w-5" />,
  },
  {
    name: "Examples",
    description: "Example page using different layouts and components.",
    href: "/examples",
    icon: <FileCode className="h-5 w-5" />,
  },
  {
    name: "Documentation",
    description: "Access the documentation for the project.",
    href: siteConfig.docsUrl,
    icon: <Compass className="h-5 w-5" />,
  },
  {
    name: "APIs",
    description: "Explore the available APIs.",
    href: "/api",
    icon: <Terminal className="h-5 w-5" />,
  },
  {
    name: "Experiments",
    description: "Experimental features and prototypes.",
    href: "/experiments",
    icon: <FlaskConical className="h-5 w-5" />,
  },
  {
    name: "Device Registration Debug",
    description: "Debug device registration issues",
    href: "/api/debug-device-registration",
    icon: <Monitor className="h-5 w-5" />,
  },
]

const DebugPage = () => {
  return (
    <div className="container relative hidden h-[calc(100vh-80px)] flex-col md:flex">
      <div className="flex-col pt-6 space-y-2 md:space-y-5">
        <h1 className="text-3xl font-bold tracking-tight">Debug</h1>
        <p className="text-muted-foreground">A collection of debug tools and resources.</p>
      </div>
      <div className="grid gap-6 mt-10 sm:grid-cols-2 md:grid-cols-4">
        {debugLinks.map((link) => (
          <Link key={link.href} href={link.href} className="space-y-2">
            <div className="flex items-center space-x-2">
              {link.icon}
              <h2 className="text-lg font-semibold">{link.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{link.description}</p>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DebugPage
