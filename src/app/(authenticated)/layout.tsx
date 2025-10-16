"use client"

import { redirect, useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!session?.user) return
      
      setIsLoadingOrg(true)
      try {
        const token = localStorage.getItem("bearer_token")
        const response = await fetch("/api/organizations/current", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setOrganization(data.organization)
        }
      } catch (error) {
        console.error("Failed to fetch organization:", error)
      } finally {
        setIsLoadingOrg(false)
      }
    }

    fetchOrganization()
  }, [session])

  if (isPending || isLoadingOrg) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const userData = {
    email: session.user.email,
    full_name: session.user.name,
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader user={userData} organization={organization} />
        <main className="flex-1 overflow-y-auto bg-background p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}