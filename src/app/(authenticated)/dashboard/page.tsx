"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Activity, FileText, Users } from "lucide-react"
import { PlanUsageIndicator } from "@/components/plan-usage-indicator"

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Welcome back! Here's an overview of your evaluation platform.
        </p>
      </div>

      {/* Usage Indicator */}
      <PlanUsageIndicator />

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">Across all types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Traces</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Recent traces</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Link href="/evaluations/new">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Create Evaluation</CardTitle>
              <CardDescription className="text-sm">Set up a new test suite</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/traces">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">View Traces</CardTitle>
              <CardDescription className="text-sm">Inspect LLM calls and debug</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/evaluations">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Browse Evaluations</CardTitle>
              <CardDescription className="text-sm">View all test suites</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Recent Evaluation Runs</h3>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="p-3 sm:p-4 space-y-2">
                <p className="font-medium text-sm sm:text-base">Evaluation Run #124</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  100 cases • 95 passed • 5 failed
                </p>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                >
                  completed
                </span>
              </div>
              <div className="p-3 sm:p-4 space-y-2">
                <p className="font-medium text-sm sm:text-base">Evaluation Run #8</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  50 cases • 48 passed • 2 failed
                </p>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-500"
                >
                  running
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}