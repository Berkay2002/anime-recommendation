"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (!mounted) return
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {mounted ? (
        resolvedTheme === "dark" ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )
      ) : (
        <Sun className="size-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
