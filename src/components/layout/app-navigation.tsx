"use client"

import { useState } from "react"
import type { ViewType } from "@/types"
import { LayoutDashboard, ListTodo, FileText } from "lucide-react"

interface AppNavigationProps {
  activeView: ViewType
  onChangeView: (view: ViewType) => void
}

export function AppNavigation({ activeView, onChangeView }: AppNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleViewChange = (view: ViewType) => {
    onChangeView(view)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleViewChange("objectifs")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeView === "objectifs"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <ListTodo className="inline-block mr-2 h-5 w-5" />
              Objectifs
            </button>
            <button
              onClick={() => handleViewChange("dashboard")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeView === "dashboard"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard className="inline-block mr-2 h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => handleViewChange("plans")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeView === "plans"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <FileText className="inline-block mr-2 h-5 w-5" />
              Plans
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button
            onClick={() => handleViewChange("objectifs")}
            className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
              activeView === "objectifs"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ListTodo className="inline-block mr-2 h-5 w-5" />
            Objectifs
          </button>
          <button
            onClick={() => handleViewChange("dashboard")}
            className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
              activeView === "dashboard"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <LayoutDashboard className="inline-block mr-2 h-5 w-5" />
            Dashboard
          </button>
          <button
            onClick={() => handleViewChange("plans")}
            className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
              activeView === "plans"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <FileText className="inline-block mr-2 h-5 w-5" />
            Plans
          </button>
        </div>
      </div>
    </nav>
  )
}
