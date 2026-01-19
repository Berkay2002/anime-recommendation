import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ConsoleFilter } from "@/components/ConsoleFilter"
import ClerkThemeProvider from "@/components/ClerkThemeProvider"
import Navbar from "../components/Navbar"
import "../styles/globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* Meta tags and favicons can go here */}</head>
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <ClerkThemeProvider>
            <ConsoleFilter />
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            {children}
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
