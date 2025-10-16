"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token")
      if (authToken && typeof window !== 'undefined') {
        localStorage.setItem("bearer_token", authToken)
      }
    },
    onRequest: (ctx) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("bearer_token")
        if (token) {
          ctx.headers.set("Authorization", `Bearer ${token}`)
        }
      }
      return ctx
    }
  }
})

export function useSession() {
  const [session, setSession] = useState<any>(null)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchSession = async () => {
    try {
      setIsPending(true)
      const res = await authClient.getSession()
      setSession(res.data)
      setError(null)
    } catch (err) {
      console.error("Session fetch error:", err)
      setSession(null)
      setError(err)
    } finally {
      setIsPending(false)
    }
  }

  const refetch = () => {
    fetchSession()
  }

  useEffect(() => {
    fetchSession()
  }, [])

  return { data: session, isPending, error, refetch }
}