"use client"

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import SearchBar from "./SearchBar"
import ThemeToggle from "./ThemeToggle"
import SectionHeader from "./SectionHeader"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home" },
  { href: "/anime", label: "Anime" },
]

const Navbar: React.FC = () => {
  const pathname = usePathname()

  return (
    <header className="supports-[backdrop-filter]:bg-background/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto flex flex-col gap-4 px-5 py-4 md:px-4">
        <div className="flex items-center justify-between md:hidden">
          <Link
            href="/"
            className="text-primary inline-flex items-center text-3xl font-bold"
          >
            AniMatch
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border/70"
                >
                  <Menu className="size-5" aria-hidden="true" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                onOpenAutoFocus={(event) => event.preventDefault()}
                className="flex w-full max-w-xs flex-col gap-6 border-border/60 bg-background/95 px-6 py-6 backdrop-blur"
              >
                <SectionHeader
                  title="Browse AniMatch"
                  description="Jump to a page or search for a new series."
                />

                <SearchBar />

                <div className="flex flex-col gap-2">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="secondary" className="w-full">
                        Sign in
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full">Sign up</Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center">
                      <UserButton />
                    </div>
                  </SignedIn>
                </div>

                <nav className="flex flex-col gap-1">
                  {links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                      <SheetClose asChild key={link.href}>
                        <Button
                          asChild
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "justify-start text-base",
                            isActive && "font-semibold"
                          )}
                        >
                          <Link href={link.href}>{link.label}</Link>
                        </Button>
                      </SheetClose>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:grid md:grid-cols-[auto_1fr_auto]">
          <Link
            href="/"
            className="text-primary inline-flex flex-none items-center text-3xl font-bold"
          >
            AniMatch
          </Link>
          <div className="w-full md:max-w-xl md:justify-self-center">
            <SearchBar />
          </div>
          <div className="flex items-center justify-end gap-4">
            <ThemeToggle />
            <NavigationMenu viewport={false} className="justify-end">
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
                            ? "bg-primary text-primary-foreground shadow-sm"
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
            <SignedOut>
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign up</Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
