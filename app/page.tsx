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
  Play,
  Shield,
  Clock,
  Target,
  Smartphone,
  Wifi,
  Settings,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <Link className="flex items-center" href="/">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SignageCloud</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center space-x-6">
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900" href="/about">
            About
          </Link>
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900" href="/contact">
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Sign In
          </Link>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 lg:px-6 py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              🚀 New: AI-Powered Content Optimization
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Transform Your Digital
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Signage Experience
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Manage your digital displays, upload content, and create engaging playlists from one powerful cloud
              platform. Perfect for businesses of all sizes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 bg-transparent">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ Customers</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-xl overflow-hidden shadow-2xl bg-white border">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-4 text-sm text-gray-600">SignageCloud Dashboard</span>
              </div>

              <div className="p-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Active Screens</span>
                        <Monitor className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">24</div>
                      <div className="text-xs text-green-600">+12% from last month</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Content Items</span>
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">156</div>
                      <div className="text-xs text-green-600">+8% from last month</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Playlists</span>
                        <Target className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">12</div>
                      <div className="text-xs text-green-600">+4% from last month</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <Button size="sm" variant="ghost">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Screen "Lobby Display" came online</span>
                      <span className="text-gray-400 ml-auto">2 min ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">New content uploaded: "Summer Sale.mp4"</span>
                      <span className="text-gray-400 ml-auto">5 min ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Playlist "Store Promotions" updated</span>
                      <span className="text-gray-400 ml-auto">12 min ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 lg:px-6 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage digital signage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From content creation to remote management, our platform provides all the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Monitor className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Remote Management</h3>
                <p className="text-gray-600">
                  Control all your displays from anywhere. Update content, monitor status, and manage schedules
                  remotely.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
                <p className="text-gray-600">
                  Track performance with detailed analytics. See what content works best and optimize your strategy.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile App</h3>
                <p className="text-gray-600">
                  Manage your signage on the go with our mobile app. Upload content and monitor displays anywhere.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Wifi className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cloud Storage</h3>
                <p className="text-gray-600">
                  Secure cloud storage for all your content. Access your media library from any device, anytime.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Setup</h3>
                <p className="text-gray-600">
                  Get started in minutes with our simple setup process. No technical expertise required.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                <p className="text-gray-600">
                  Bank-level security with encryption, user management, and compliance with industry standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="px-4 lg:px-6 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by businesses across industries
            </h2>
            <p className="text-lg text-gray-600">
              From retail to healthcare, our platform adapts to your industry needs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center p-4">
              <Building className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Retail</span>
            </div>
            <div className="text-center p-4">
              <Utensils className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Restaurants</span>
            </div>
            <div className="text-center p-4">
              <Hotel className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Hotels</span>
            </div>
            <div className="text-center p-4">
              <Stethoscope className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Healthcare</span>
            </div>
            <div className="text-center p-4">
              <GraduationCap className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Education</span>
            </div>
            <div className="text-center p-4">
              <Car className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Automotive</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 lg:px-6 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">What our customers say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "SignageCloud has transformed how we communicate with our customers. The setup was incredibly easy and
                  the results have been amazing."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-sm">Sarah Johnson</div>
                    <div className="text-xs text-gray-500">Marketing Director, RetailCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The analytics feature helps us understand what content resonates with our audience. It's been a
                  game-changer for our business."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-sm">Michael Chen</div>
                    <div className="text-xs text-gray-500">Owner, Downtown Cafe</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Managing multiple locations is now effortless. We can update all our displays instantly from one
                  dashboard."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-sm">Emma Rodriguez</div>
                    <div className="text-xs text-gray-500">Operations Manager, FitLife Gyms</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 lg:px-6 py-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to transform your digital signage?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using SignageCloud to engage their customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4">
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-4 bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 lg:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">SignageCloud</span>
              </div>
              <p className="text-gray-400 text-sm">The complete digital signage platform for modern businesses.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
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
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Status
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© 2025 SignageCloud. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
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
