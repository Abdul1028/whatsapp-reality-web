"use client"

import { useState } from "react"
import { useThemeConfig } from "@/components/active-theme"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "next-themes"
import { GhibliDarkModeWarningDialog } from "@/components/ui/ghibli-dark-mode-warning-dialog"

const DEFAULT_THEMES = [
  {
    name: "Ghibli",
    value: "default",
  },
  {
    name: "Blue",
    value: "blue",
  },
  {
    name: "Green",
    value: "green",
  },
  {
    name: "Amber",
    value: "amber",
  },
  {
    name: "Pink",
    value: "pink",
  },
  {
    name: "Terracotta",
    value: "terracotta",
  },
  {
    name: "Ochre",
    value: "ochre",
  },
]

const SCALED_THEMES = [
  {
    name: "Ghibli",
    value: "default-scaled",
  },
  {
    name: "Blue",
    value: "blue-scaled",
  },
  {
    name: "Pink",
    value: "pink-scaled",
  },
  {
    name: "Terracotta",
    value: "terracotta-scaled",
  },
  {
    name: "Ochre",
    value: "ochre-scaled",
  },
]

const MONO_THEMES = [
  {
    name: "Mono",
    value: "mono-scaled",
  },
]

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig()
  const { resolvedTheme, setTheme } = useTheme()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingTheme, setPendingTheme] = useState<string | null>(null)

  const handleThemeChange = (value: string) => {
    const isTryingToSelectGhibli = value.startsWith('default')

    if (isTryingToSelectGhibli && resolvedTheme === 'dark') {
      setPendingTheme(value)
      setIsDialogOpen(true)
      return
    }
    setActiveTheme(value)
    setPendingTheme(null)
  }

  const handleSwitchToLightAndSetTheme = () => {
    if (pendingTheme) {
      setTheme('light')
      setActiveTheme(pendingTheme)
    }
    setIsDialogOpen(false)
    setPendingTheme(null)
  }

  const handleCancelThemeSelection = () => {
    setIsDialogOpen(false)
    setPendingTheme(null)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Label htmlFor="theme-selector" className="sr-only">
          Theme
        </Label>
        <Select
          value={isDialogOpen ? activeTheme : activeTheme}
          onValueChange={handleThemeChange}
        >
          <SelectTrigger
            id="theme-selector"
            size="sm"
            className="justify-start *:data-[slot=select-value]:w-12"
          >
            <span className="text-muted-foreground hidden sm:block">
              Select a theme:
            </span>
            <span className="text-muted-foreground block sm:hidden">Theme</span>
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              <SelectLabel>Default</SelectLabel>
              {DEFAULT_THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Scaled</SelectLabel>
              {SCALED_THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Monospaced</SelectLabel>
              {MONO_THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <GhibliDarkModeWarningDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Switch to Light Mode?"
        description="Ghibli theme is designed for light mode. Switch to light mode to use this theme?"
        cancelText="Cancel Selection"
        actionText="Switch to Light Mode"
        onCancel={handleCancelThemeSelection}
        onAction={handleSwitchToLightAndSetTheme}
      />
    </>
  )
}