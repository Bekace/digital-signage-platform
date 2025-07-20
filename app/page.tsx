import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Star,
  Users,
  Globe,
  BarChart3,
  Monitor,
  Building,
  Utensils,
  Hotel,
  Stethoscope,
  Car,
  GraduationCap,
  ChevronDown,
  Zap,
  Coffee,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 lg:px-8 h-16 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-50">
        <Link className="flex items-center" href="/">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded transform rotate-12"></div>
            <span className="text-xl font-semibold text-gray-900">Xcreen</span>
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
      <section className="px-6 lg:px-8 py-16 lg:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI-Powered
              </span>{" "}
              <span className="text-gray-900">Audience Analytics</span>
              <br />
              <span className="text-gray-900">and Smart Digital Signage</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Analyze, engage and monetize offline audience to increase sales. Start gaining store visitor insights with
              a pilot project in just one week!
            </p>

            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-medium inline-flex items-center space-x-2 mb-8">
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            {/* Compliance Badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
              <Badge variant="outline" className="px-3 py-1 text-xs">
                EU AI ACT COMPLIANT
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs">
                GDPR COMPLIANT
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs">
                LGPD COMPLIANT
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs">
                CCPA COMPLIANT
              </Badge>
            </div>
          </div>

          {/* Hero Video */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
              <video className="w-full h-auto" autoPlay muted loop playsInline controls>
                <source
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DISPL-compress-TRKe0Ig6NSVvrVPYE1kVkvWhGyjbjF.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* AI Ethics Section */}
      <section className="px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Built on the foundations of{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI ethics and security
                </span>
              </h2>
              <p className="text-gray-600 mb-6">
                Our platform is designed with privacy-first principles, ensuring complete anonymity while delivering
                powerful insights. We comply with global data protection regulations and maintain the highest standards
                of ethical AI practices.
              </p>
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 bg-transparent">
                Learn more
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden h-64">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/67ad0591c8a8fa1fe77c3eb7_IMG_Security.jpg-j4j70anygT4Ax2qFa2av0YrhcxvRMm.jpeg"
                  alt="Data security and privacy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="px-6 lg:px-8 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12">Industries</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <Monitor className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Media Owners</h3>
                <p className="text-sm text-gray-600">Digital out-of-home advertising networks</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <Building className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Malls</h3>
                <p className="text-sm text-gray-600">Shopping centers and retail complexes</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <Zap className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Consumer Electronics</h3>
                <p className="text-sm text-gray-600">Electronics and technology retailers</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <Utensils className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Restaurants & Cafes</h3>
                <p className="text-sm text-gray-600">Food service and hospitality</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <Hotel className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Hotels & Resorts</h3>
                <p className="text-sm text-gray-600">Hospitality and tourism industry</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <Coffee className="h-8 w-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Food & Beverage</h3>
                <p className="text-sm text-gray-600">F&B chains and quick service restaurants</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="flex items-center space-x-2 text-gray-600">
              <Stethoscope className="h-5 w-5" />
              <span className="text-sm">Healthcare</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Car className="h-5 w-5" />
              <span className="text-sm">Transportation</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm">Education</span>
            </div>
          </div>
        </div>
      </section>

      {/* All-in-one Solution */}
      <section className="px-6 lg:px-8 py-16 bg-gradient-to-br from-purple-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">All-in-one solution</h2>
          <p className="text-lg text-purple-100 mb-12 max-w-3xl mx-auto">
            From audience analytics to content management, our platform provides everything you need to create engaging
            digital experiences and drive business growth.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur border-white/20 p-8">
              <CardContent className="p-0 text-left">
                <BarChart3 className="h-12 w-12 text-purple-300 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Analytics Dashboard</h3>
                <p className="text-purple-100 mb-6">
                  Real-time insights and comprehensive reporting for data-driven decisions that boost your ROI.
                </p>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  Explore
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20 p-8">
              <CardContent className="p-0 text-left">
                <Monitor className="h-12 w-12 text-purple-300 mb-4" />
                <h3 className="text-xl font-semibold mb-4">Content Management</h3>
                <p className="text-purple-100 mb-6">
                  Easy-to-use tools for creating, scheduling, and managing digital signage content across all locations.
                </p>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  Explore
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Make Decisions Section */}
      <section className="px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Make decisions based on data</h2>
              <p className="text-gray-600 mb-6">
                Get real-time insights about your audience behavior, demographics, and engagement patterns to optimize
                your business strategy. Our AI-powered analytics provide actionable intelligence that drives results.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Real-time audience demographics</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Engagement and dwell time analytics</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Heat maps and traffic patterns</span>
                </li>
              </ul>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">View Dashboard</Button>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-20 w-20 text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Analytics Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Media Player Section */}
      <section className="px-6 lg:px-8 py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-8 h-80 flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="h-20 w-20 text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">AI Media Player Hardware</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">AI Media Player for Easy Start</h2>
              <p className="text-gray-600 mb-6">
                Plug-and-play solution that gets you started with AI-powered digital signage in minutes, not months. Our
                hardware comes pre-configured with everything you need.
              </p>
              <div className="flex items-center space-x-4 mb-6">
                <Badge className="bg-green-100 text-green-800">Easy Setup</Badge>
                <Badge className="bg-blue-100 text-blue-800">Cloud-based</Badge>
                <Badge className="bg-purple-100 text-purple-800">AI-powered</Badge>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">5-minute setup process</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Built-in AI processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Remote management capabilities</span>
                </div>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Xcreen works in 1000+ locations globally</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Trusted by businesses worldwide, our platform operates across multiple countries and continents.
          </p>
          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="w-12 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">IT</span>
            </div>
            <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">EU</span>
            </div>
            <div className="w-12 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">BR</span>
            </div>
            <div className="w-12 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">SG</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1000+</div>
              <div className="text-sm text-gray-600">Active Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">50+</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">10M+</div>
              <div className="text-sm text-gray-600">Analyzed Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Certification Section */}
      <section className="px-6 lg:px-8 py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Become certified Xcreen</h2>
              <p className="text-gray-600 mb-6">
                Join our partner network and get certified to offer Xcreen solutions to your clients. Access
                comprehensive training, resources, and ongoing support to grow your business.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Comprehensive training program</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Sales and marketing support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">Technical certification</span>
                </div>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">Get Certified</Button>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-8 h-64 flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium">Xcreen Certification Program</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Reviews */}
      <section className="px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12">Our partners reviews</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Sarah Johnson",
                company: "RetailTech Solutions",
                review:
                  "Xkreen has transformed how we understand our customers. The insights are incredible and the setup was seamless.",
              },
              {
                name: "Michael Chen",
                company: "Digital Displays Inc",
                review:
                  "The AI-powered analytics have helped our clients increase sales by 25%. Outstanding platform and support.",
              },
              {
                name: "Emma Rodriguez",
                company: "Smart Signage Co",
                review:
                  "Implementation was quick and our team was up and running in no time. The ROI has been fantastic.",
              },
              {
                name: "David Kim",
                company: "Future Media Group",
                review: "Best-in-class audience analytics. Our clients love the detailed insights and real-time data.",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-gray-500">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">"{testimonial.review}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Xkreen Academy */}
      <section className="px-6 lg:px-8 py-16 bg-gradient-to-br from-purple-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Xkreen Academy helps you start selling faster</h2>
              <p className="text-purple-100 mb-6">
                Comprehensive training programs, resources, and certification courses to help you master Xkreen
                technology and grow your business. Get access to expert-led sessions and hands-on workshops.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                  <span className="text-purple-100">Interactive online courses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                  <span className="text-purple-100">Live expert sessions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                  <span className="text-purple-100">Hands-on workshops</span>
                </div>
              </div>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                Start Learning
              </Button>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur rounded-lg p-8 h-64 flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                  <p className="text-purple-100 font-medium">Xkreen Academy Learning Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book a Demo CTA */}
      <section className="px-6 lg:px-8 py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white"></div>
              ))}
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Book a demo</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            <strong>3.5K people call us now</strong>
            <br />
            to analyze, engage and monetize offline audience to increase sales
          </p>

          <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg">Book a demo</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded transform rotate-12"></div>
                <span className="text-xl font-semibold">Xkreen</span>
              </div>
              <p className="text-gray-400 text-sm">AI-powered audience analytics and smart digital signage platform.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Audience Analytics
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Digital Signage
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Content Management
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    AI Media Player
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Industries</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Retail
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Hospitality
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Healthcare
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Transportation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© 2025 Xkreen. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white">
                <Globe className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Users className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
