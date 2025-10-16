import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Mail, MessageSquare, Headphones, Building } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-base sm:text-xl font-bold truncate">AI Evaluation Platform</Link>
            <Button asChild size="sm" className="h-9 flex-shrink-0">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 flex-1">
        {/* Hero */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Get in Touch</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Have questions about the platform? Want to discuss enterprise plans? 
            We're here to help you build reliable AI systems.
          </p>
        </div>

        {/* Contact Options */}
        <section className="mb-12 sm:mb-16">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-5 sm:p-6 text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Sales Inquiries</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Discuss pricing, features, and custom plans for your team.
              </p>
              <a href="mailto:sales@aievalplatform.com" className="text-xs sm:text-sm text-blue-500 hover:underline break-all">
                sales@aievalplatform.com
              </a>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 sm:p-6 text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <Headphones className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Technical Support</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Get help with integrations, API issues, or troubleshooting.
              </p>
              <a href="mailto:support@aievalplatform.com" className="text-xs sm:text-sm text-blue-500 hover:underline break-all">
                support@aievalplatform.com
              </a>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 sm:p-6 text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <Building className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Partnerships</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Explore integration partnerships and collaboration opportunities.
              </p>
              <a href="mailto:partnerships@aievalplatform.com" className="text-xs sm:text-sm text-blue-500 hover:underline break-all">
                partnerships@aievalplatform.com
              </a>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 sm:p-6 text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">General Inquiries</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Everything else — press, careers, or just to say hello.
              </p>
              <a href="mailto:hello@aievalplatform.com" className="text-xs sm:text-sm text-blue-500 hover:underline break-all">
                hello@aievalplatform.com
              </a>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-12 sm:mb-16">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg border border-border bg-card p-5 sm:p-6 md:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Send Us a Message</h2>
              <form className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-sm h-9 sm:h-10"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-sm h-9 sm:h-10"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-sm h-9 sm:h-10"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input 
                    type="text" 
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-sm h-9 sm:h-10"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <select className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-sm h-9 sm:h-10">
                    <option>Sales Inquiry</option>
                    <option>Technical Support</option>
                    <option>Partnership Opportunity</option>
                    <option>General Question</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea 
                    rows={6}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Community */}
        <section>
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Join Our Community</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
              Connect with other developers, share best practices, and get help from our team.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href="https://discord.gg/aievalplatform" target="_blank" rel="noopener noreferrer">
                  Discord Community
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href="https://github.com/aievalplatform" target="_blank" rel="noopener noreferrer">
                  GitHub Discussions
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}