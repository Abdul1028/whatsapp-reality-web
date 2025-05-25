"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Menu, Search, Bell } from "lucide-react"
import Link from "next/link"
import { ThemeSelector } from "@/app/dashboard/components/theme-selector"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useThemeConfig } from "@/components/active-theme"
import { GhibliDarkModeWarningDialog } from "@/components/ui/ghibli-dark-mode-warning-dialog"
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"

export function StickyNavbar({ showSidebarTrigger = false }: { showSidebarTrigger?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { activeTheme } = useThemeConfig()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const handleThemeToggle = () => {
    const isGhibliActive = activeTheme.startsWith('default');
    if (resolvedTheme === 'light') {
      if (isGhibliActive) {
        setIsDialogOpen(true);
        return;
      }
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const handleForceDarkMode = () => {
    setTheme('dark');
    setIsDialogOpen(false);
  }

  const handleCancelDarkMode = () => {
    setIsDialogOpen(false);
  }

  return (
    <>
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left section: Logo and optional original sidebar trigger */}
          <div className="flex items-center gap-2">
            {showSidebarTrigger && (
              <SidebarTrigger className="h-9 w-9 rounded-full hover:bg-muted transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            )}
            <Link href="/dashboard" className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              WIT-REALITY
            </Link>
          </div>

          {/* Mobile Right Section: Theme Selector and Hamburger Menu (md:hidden) */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeSelector />
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6">
                <SheetHeader className="mb-6 text-left">
                  <SheetTitle>
                    <Link href="/dashboard" onClick={() => setIsSheetOpen(false)} className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                WIT-REALITY
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4">
                  {/* Search Input */}
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="w-full bg-muted/40 border-none pl-10 h-10 focus-visible:ring-primary/20" />
                  </div>
                  
                  <Button variant="ghost" onClick={() => { handleThemeToggle(); setIsSheetOpen(false); }} className="w-full justify-start gap-3 px-2 h-10">
                    {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span>Switch to {resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                  </Button>
                  
                  <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="w-full justify-start gap-3 px-2 h-10 relative">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                    <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center bg-primary text-[10px]">3</Badge>
                  </Button>
                  
                  <Separator className="my-2"/>
                  
                  <SignedOut>
                    <SheetClose asChild><Button variant="outline" className="w-full h-10" asChild><Link href="/sign-in">Login</Link></Button></SheetClose>
                    <SheetClose asChild><Button className="w-full h-10" asChild><Link href="/sign-up">Signup</Link></Button></SheetClose>
                  </SignedOut>
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
            </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navbar Items (hidden md:flex) */}
          <div className="hidden md:flex flex-1 items-center">
            {/* Desktop Search: Centered */}
            <div className="flex-1 px-6 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full bg-muted/40 border-none pl-9 focus-visible:ring-primary/20"
              />
            </div>
          </div>
          
            {/* Desktop Right Items */}
            <div className="flex items-center space-x-3">
            <ThemeSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className="h-9 w-9 rounded-full hover:bg-muted transition-colors"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted transition-colors relative">
              <Bell className="h-[1.2rem] w-[1.2rem]" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-[10px]">
                3
              </Badge>
                <span className="sr-only">Notifications</span>
            </Button>

                <SignedOut>
                <Button variant="outline" asChild><Link href="/sign-in">Login</Link></Button>
                <Button asChild><Link href="/sign-up">Signup</Link></Button>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
            </div>
          </div>
        </div>
      </div>

      <GhibliDarkModeWarningDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Dark Mode Not Recommended"
        description="Ghibli theme is designed for light mode and may not display as intended in dark mode."
        cancelText="Okay, Stay in Light Mode"
        actionText="Force Dark Mode Anyway"
        onCancel={handleCancelDarkMode}
        onAction={handleForceDarkMode}
      />
    </>
  )
}