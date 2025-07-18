import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 lg:px-8 h-16 flex items-center justify-between border-b border-gray-100">
        <Link className="flex items-center" href="/">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded transform rotate-12"></div>
            <span className="text-xl font-semibold text-gray-900">displ</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center space-x-8">
          <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 cursor-pointer">
            <span className="text-sm font-medium">Solutions</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 cursor-pointer">
            <span className="text-sm font-medium">Industries</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900" href="/case-studies">
            Case studies
          </Link>
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900" href="/pricing">
            Pricing
          </Link>
          <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 cursor-pointer">
            <span className="text-sm font-medium">Resources</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900" href="/become-partner">
            Become a Partner
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          </button>
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Log in
          </Link>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Book a demo
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI-Powered
              </span>{" "}
              Audience Analytics
              <br />
              and Smart Digital Signage
            </h1>

            <p className="text-lg lg:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Analyze, engage <span className="text-purple-600 font-medium">and</span> monetize{" "}
              <span className="text-gray-400">offline audience</span> to increase sales. Start gaining store
              <br />
              visitor insights with a pilot project in just one week!
            </p>

            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-medium inline-flex items-center space-x-2 mb-16">
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            {/* Compliance Badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">AI</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">EU AI ACT</div>
                  <div className="text-xs text-gray-500">COMPLIANT</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-600 rounded"></div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">GDPR</div>
                  <div className="text-xs text-gray-500">COMPLIANT</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">LGPD</div>
                  <div className="text-xs text-gray-500">COMPLIANT</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-600 rounded-full"></div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">CCPA</div>
                  <div className="text-xs text-gray-500">COMPLIANT</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative max-w-5xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://sjc.microlink.io/rFVNZD3ID-Qf3siQc0Ft3mB0sBBAK5L6Y94KlpgcPLQGVmv7zmgQY9U3c53baHlOkFVSUFhFNNh_gcv7xihB9Q.jpeg"
                  alt="AI-powered audience analytics in retail store showing person detection and demographic data"
                  className="w-full h-auto"
                />

                {/* Analytics Overlay */}
                <div className="absolute top-8 left-8 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Anonymous Hash #334
                </div>

                {/* Person Detection Box */}
                <div className="absolute top-20 left-20 w-48 h-64 border-4 border-purple-500 rounded-lg"></div>

                {/* Analytics Panel */}
                <div className="absolute top-32 right-8 bg-black/80 text-white p-4 rounded-lg text-sm space-y-2 min-w-[200px]">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Dwell time:</span>
                    <span>00:04</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">POI:</span>
                    <span>#2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Gender:</span>
                    <span>Female</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Age:</span>
                    <span>29</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Facial expressions:</span>
                    <span>Happy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
