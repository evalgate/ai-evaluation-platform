"use client"

import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load pricing table to reduce initial bundle size
const PricingTable = dynamic(
  () => import("@/components/autumn/pricing-table").then(m => m.PricingTable),
  { 
    ssr: false,
    loading: () => (
      <div className="py-12">
        <Skeleton className="h-96 w-full max-w-6xl mx-auto" />
      </div>
    )
  }
)

export default function PricingPage() {
  const { data: session, isPending } = useSession()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="sm" asChild className="h-9 flex-shrink-0">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <ThemeToggle />
              {isPending ? (
                <div className="h-9 w-16 sm:w-20 animate-pulse bg-muted rounded" />
              ) : session?.user ? (
                <Button asChild size="sm" className="h-9">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild size="sm" className="h-9 hidden sm:flex">
                    <Link href="/auth/login">Sign in</Link>
                  </Button>
                  <Button asChild size="sm" className="h-9">
                    <Link href="/auth/sign-up">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 flex-1 py-8 sm:py-12 md:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Start with our free Developer plan or upgrade for more traces, projects, and premium support.
          </p>
        </div>

        {/* Pricing Table */}
        <PricingTable />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}