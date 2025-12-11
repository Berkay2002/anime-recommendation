import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
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
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
