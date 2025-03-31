import { cookies } from "next/headers"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ActiveThemeProvider } from "@/components/active-theme"
import { AppSidebar } from "@/app/dashboard/components/app-sidebar"
import { SiteHeader } from "@/app/dashboard/components/site-header"

import "@/app/dashboard/colors.css"
import "@/app/dashboard/theme.css"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  const initialTheme = cookieStore.get("active_theme")?.value || "default"
  const activeThemeValue = cookieStore.get("active_theme")?.value
  const isScaled = activeThemeValue?.endsWith("-scaled")
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
        } as React.CSSProperties
      }
    >
      <ActiveThemeProvider initialTheme={initialTheme}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </ActiveThemeProvider>
    </SidebarProvider>
  )
}