"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Menu, Search, Bell, User } from "lucide-react"
import { ThemeSelector } from "@/app/dashboard/components/theme-selector"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useThemeConfig } from "@/components/active-theme"
import { GhibliDarkModeWarningDialog } from "@/components/ui/ghibli-dark-mode-warning-dialog"

export function StickyNavbar({ showSidebarTrigger = false }: { showSidebarTrigger?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { activeTheme } = useThemeConfig()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
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
        <div className="flex h-16 items-center px-6">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {showSidebarTrigger && (
              <SidebarTrigger className="h-9 w-9 rounded-full hover:bg-muted transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            )}
            <div className="hidden md:flex items-center gap-2">
              <span className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                WIT-REALITY
              </span>
            </div>
          </div>
          {/* Middle section - Search */}
          <div className="hidden md:flex flex-1 items-center justify-center px-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full bg-muted/40 border-none pl-9 focus-visible:ring-primary/20"
              />
            </div>
          </div>
          
          {/* Right section */}
          <div className="flex flex-1 md:flex-none items-center justify-end space-x-4">
            <ThemeSelector />
            
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            
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
            </Button>
            
            <Avatar className="h-9 w-9 border-2 border-primary/10 hover:border-primary/30 transition-colors cursor-pointer">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
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