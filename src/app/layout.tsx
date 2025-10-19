import type React from "react"
import type { Metadata } from "next"
// eslint-disable-next-line import/no-unresolved
import { GeistSans } from "geist/font/sans"
// eslint-disable-next-line import/no-unresolved
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react"
import CustomAutumnProvider from "@/lib/autumn-provider"
import "./globals.css"
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

export const metadata: Metadata = {
  title: "AI Evaluation Platform",
  description: "Comprehensive AI evaluation and testing platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased font-sans">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <CustomAutumnProvider>
              {children}
            </CustomAutumnProvider>
            <Toaster />
          </ThemeProvider>
        </Suspense>
        <Analytics />
        <VisualEditsMessenger />
      </body>
    </html>
  )
}