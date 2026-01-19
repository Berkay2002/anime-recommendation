"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"

type ClerkThemeProviderProps = {
  children: React.ReactNode
}

const ClerkThemeProvider = ({ children }: ClerkThemeProviderProps) => {
  const { resolvedTheme } = useTheme()
  const appearance = resolvedTheme === "dark" ? { baseTheme: dark } : undefined

  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>
}

export default ClerkThemeProvider
