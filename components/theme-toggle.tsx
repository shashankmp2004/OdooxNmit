"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration issues
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-12 h-6 bg-gray-200 rounded-full flex items-center justify-center">
        <Sun className="h-4 w-4 text-gray-600" />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      className="relative w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300 cursor-pointer focus:outline-none"
      aria-pressed={isDark}
      aria-label="Toggle theme"
    >
      {/* Sliding knob */}
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${
          isDark ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      >
        {/* Show sun in dark mode, moon in light mode */}
        {isDark ? (
          <Sun className="h-3 w-3 text-gray-600" />
        ) : (
          <Moon className="h-3 w-3 text-gray-600" />
        )}
      </div>
    </button>
  )
}