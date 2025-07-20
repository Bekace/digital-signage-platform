"use client"

import Image from "next/image"

export function DashboardFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Image src="/images/xkreen-logo.png" alt="xkreen" width={80} height={21} className="h-5 w-auto" />
          <span>© 2024 All rights reserved.</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-gray-700">
            Support
          </a>
          <a href="#" className="hover:text-gray-700">
            Privacy
          </a>
          <a href="#" className="hover:text-gray-700">
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
