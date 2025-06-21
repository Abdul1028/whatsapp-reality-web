import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { ActiveThemeProvider } from "@/components/active-theme";
import { cn } from "@/lib/utils"
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next';

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: 'WA Reality | WhatsApp Reality',
  description: 'Upload your WhatsApp chats and discover hidden insights, stats, and patterns instantly.',
  keywords: ['WhatsApp analyzer', 'chat analysis', 'message insights', 'WhatsApp stats', 'group chat stats'],
  openGraph: {
    title: 'WhatsApp Reality',
    description: 'Visualize your WhatsApp messages like never before.',
    url: 'https://www.wareality.tech',
    siteName: 'WhatsApp Reality',
    images: [
      {
        url: 'https://www.wareality.tech/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WhatsApp Reality OG Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp Reality',
    description: 'Get deep insights from your WhatsApp chats.',
    images: ['https://www.wareality.tech/og-image.png'],
  },
};




export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()

  const activeThemeValue = cookieStore.get("active_theme")?.value
  const isScaled = activeThemeValue?.endsWith("-scaled")


  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning  >
        <head>
          <link
            rel="icon"
            href="/icon?<generated>"
            type="image/<generated>"
            sizes="<generated>"
          />

          <link
            rel="apple-touch-icon"
            href="/apple-icon?<generated>"
            type="image/<generated>"
            sizes="<generated>"
          />

          <meta name="description" content="Visualize your WhatsApp messages like never before." />

          <meta property="og:url" content="https://wareality.tech" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="WhatsApp Reality" />
          <meta property="og:description" content="Visualize your WhatsApp messages like never before." />
          <meta property="og:image" content="https://www.wareality.tech/og-image.png" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta property="twitter:domain" content="wareality.tech" />
          <meta property="twitter:url" content="https://wareality.tech" />
          <meta name="twitter:title" content="WhatsApp Reality" />
          <meta name="twitter:description" content="Visualize your WhatsApp messages like never before." />
          <meta name="twitter:image" content="https://www.wareality.tech/og-image.png" />

        </head>
        <body
          className={cn(
            "bg-background overscroll-none font-sans antialiased",
            activeThemeValue ? `theme-${activeThemeValue}` : "",
            isScaled ? "theme-scaled" : "",
            `${nunito.variable} ${ptSans.variable}`,
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <ActiveThemeProvider initialTheme={activeThemeValue}>
              <div className="texture" />
              {children}
              <Toaster richColors closeButton />
            </ActiveThemeProvider>
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
