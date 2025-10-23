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
      <div className="container mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <Link
          href="/"
          className="order-1 text-primary inline-flex flex-none items-center text-3xl font-bold md:order-none"
        >
          AniMatch
        </Link>
        <NavigationMenu
          viewport={false}
          className="order-4 w-full justify-start md:order-none md:ml-6 md:w-auto"
        >
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
        <div className="order-3 w-full min-w-[240px] flex-1 md:order-none md:ml-6 md:w-auto md:flex-1">
          <SearchBar />
        </div>
        <div className="order-2 ml-auto flex flex-none items-center gap-2 md:order-none md:ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default Navbar
