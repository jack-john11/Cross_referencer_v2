"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sun, Moon, Menu, ChevronDown, User, Leaf, FolderOpen, FileText, Settings } from "lucide-react"
import { useTheme } from "next-themes"

interface HeaderProps {
  variant?: 'default' | 'authenticated'
}

export function Header({ variant = 'default' }: HeaderProps) {
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()

  const isAuthenticated = variant === 'authenticated'

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          {/* Left Section: Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">EcoloGen</span>
          </Link>
          
          {/* Center Section (Desktop): Main Navigation */}
          <nav className="flex items-center gap-6 text-sm">
            {isAuthenticated ? (
              <>
                <Button variant={pathname === '/dashboard' ? "default" : "ghost"} asChild>
                  <Link href="/dashboard">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Projects
                  </Link>
                </Button>
                <Button variant={pathname === '/' ? "default" : "ghost"} asChild>
                  <Link href="/">
                    <FileText className="mr-2 h-4 w-4" />
                    Report Generator
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      More Tools <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>NRV PDF Table Extractor</DropdownMenuItem>
                    <DropdownMenuItem>PMR PDF Table Extractor</DropdownMenuItem>
                    <DropdownMenuItem>BVD PDF Table Extractor</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="default" asChild>
                  <Link href="/">Report Generator</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      More Tools <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>NRV PDF Table Extractor</DropdownMenuItem>
                    <DropdownMenuItem>PMR PDF Table Extractor</DropdownMenuItem>
                    <DropdownMenuItem>BVD PDF Table Extractor</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2 mb-6">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="font-bold">EcoloGen</span>
              </Link>
              <nav className="flex flex-col gap-4">
                {isAuthenticated ? (
                  <>
                    <Button variant={pathname === '/dashboard' ? "default" : "ghost"} asChild>
                      <Link href="/dashboard">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Projects
                      </Link>
                    </Button>
                    <Button variant={pathname === '/' ? "default" : "ghost"} asChild>
                      <Link href="/">
                        <FileText className="mr-2 h-4 w-4" />
                        Report Generator
                      </Link>
                    </Button>
                    <h3 className="font-semibold mt-2">More Tools</h3>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      NRV PDF Table Extractor
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      PMR PDF Table Extractor
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      BVD PDF Table Extractor
                    </Link>
                  </>
                ) : (
                  <>
                    <Button variant="default" asChild>
                      <Link href="/">Report Generator</Link>
                    </Button>
                    <h3 className="font-semibold mt-2">More Tools</h3>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      NRV PDF Table Extractor
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      PMR PDF Table Extractor
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      BVD PDF Table Extractor
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Right Section: User & Display Controls */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthenticated && (
                <>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
