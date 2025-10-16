import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/evaluations" className="hover:text-foreground">Evaluations</Link></li>
              <li><Link href="/traces" className="hover:text-foreground">Traces</Link></li>
              <li><Link href="/llm-judge" className="hover:text-foreground">LLM Judge</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Developers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sdk" className="hover:text-foreground">SDK</Link></li>
              <li><Link href="/api-reference" className="hover:text-foreground">API Reference</Link></li>
              <li><Link href="/documentation" className="hover:text-foreground">Documentation</Link></li>
              <li><Link href="/guides" className="hover:text-foreground">Guides</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 sm:mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AI Evaluation Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}