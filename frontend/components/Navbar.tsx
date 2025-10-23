"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import SearchBar from "./SearchBar"
import ThemeToggle from "./ThemeToggle"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home" },
  { href: "/anime", label: "Anime" },
]

const Navbar: React.FC = () => {
  const pathname = usePathname()

  return (
    <header className="supports-[backdrop-filter]:bg-background/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto flex flex-col items-stretch gap-3 py-4 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-x-8">
        <Link
          href="/"
          className="text-primary inline-flex flex-none items-center text-3xl font-bold md:justify-self-start"
        >
          AniMatch
        </Link>
        <div className="w-full md:max-w-xl md:justify-self-center">
          <SearchBar />
        </div>
        <div className="flex w-full flex-col items-start gap-3 md:w-auto md:flex-row md:items-center md:justify-end md:gap-4 md:justify-self-end">
          <ThemeToggle />
          <NavigationMenu viewport={false} className="w-full justify-start md:w-auto md:justify-end">
            <NavigationMenuList className="gap-1 lg:gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      asChild
                      active={isActive}
                      className={cn(
                        "rounded-md px-4 py-2 text-lg font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  )
}

export default Navbar
