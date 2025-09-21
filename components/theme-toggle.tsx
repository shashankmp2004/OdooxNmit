"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [toggling, setToggling] = React.useState(false)

  // Avoid hydration issues
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const toggle = () => {
    // Add temporary class to enable smooth transitions for CSS variables
    const html = document.documentElement
    html.classList.add('theme-transition')
    setToggling(true)
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    // Remove the class after animations complete
    window.setTimeout(() => {
      html.classList.remove('theme-transition')
      setToggling(false)
    }, 350)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0 relative"
      onClick={toggle}
      aria-live="polite"
      aria-pressed={resolvedTheme === 'dark'}
    >
      {/* Icon crossfade/rotate */}
      <span className="absolute inset-0 grid place-items-center">
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            resolvedTheme === 'dark'
              ? 'opacity-0 -rotate-90 scale-75'
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
      </span>
      <span className="absolute inset-0 grid place-items-center">
        <Moon
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            resolvedTheme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-75'
          }`}
        />
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}