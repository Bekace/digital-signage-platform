"use client"

export function DashboardFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3 mt-auto">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>© 2024 SignageCloud. All rights reserved.</div>
        <div className="flex items-center space-x-4">
          <a href="/support" className="hover:text-gray-700 transition-colors">
            Support
          </a>
          <a href="/privacy" className="hover:text-gray-700 transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-gray-700 transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
