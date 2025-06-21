"use client"
import { AvatarImage } from '@/components/ui/avatar'
import { AvatarFallback } from '@/components/ui/avatar'
import { Avatar } from '@/components/ui/avatar'
import { GhibliDarkModeWarningDialog } from '@/components/ui/ghibli-dark-mode-warning-dialog'
import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSelector } from '@/app/dashboard/components/theme-selector'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react' 
import { useTheme } from 'next-themes'
import { useThemeConfig } from '@/components/active-theme'
import { Moon, Sun } from 'lucide-react'
import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { MessageSquareText } from "lucide-react";

function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { activeTheme } = useThemeConfig()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    const isGhibliActive = activeTheme?.startsWith('default');

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
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left section */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <Link href="/">WA-REALITY</Link>
            </span>
          </div>

          {/* Right section */}
          <div className="flex flex-none items-center justify-end space-x-3 md:space-x-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className="h-9 w-9 rounded-full hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            {!mounted && (
              <div className="h-9 w-9 rounded-full bg-muted/40 animate-pulse"></div>
            )}

            {mounted && (
              <>
                <SignedOut>
                  <Button variant="outline" size="sm"><Link href="/sign-in">Login</Link></Button>
                  <Button size="sm"><Link href="/sign-up">Signup</Link></Button>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            )}
            {!mounted && (
              <>
                <div className="h-9 w-16 rounded-md bg-muted/40 animate-pulse"></div>
                <div className="h-9 w-20 rounded-md bg-muted/40 animate-pulse"></div>
              </>
            )}
          </div>
        </div>
      </div>

      {mounted && (
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
      )}
    </>
  )
}
export default Navbar
