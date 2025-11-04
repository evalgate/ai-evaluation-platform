import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Terminal, Sparkles, Zap, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"
import { CopyButton } from "@/components/copy-button"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SDK Quick Start - AI Evaluation Platform",
  description: "Production-ready TypeScript SDK for tracing, testing, and monitoring your LLM applications. Built for developers who ship fast.",
  openGraph: {
    title: "SDK Quick Start - AI Evaluation Platform",
    description: "Production-ready TypeScript SDK for tracing, testing, and monitoring your LLM applications.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SDK Quick Start - AI Evaluation Platform",
    description: "Production-ready TypeScript SDK for tracing, testing, and monitoring your LLM applications.",
  },
}

export default function SDKPage() {
  const installCode = "npm install @evalai/sdk\n# or\nyarn add @evalai/sdk"
  
  const initCode = `import { AIEvalClient } from '@evalai/sdk';

const client = AIEvalClient.init({ 
  apiKey: process.env.EVALAI_API_KEY 
});`

  const traceCode = `const trace = await client.traces.create({
  name: 'Chat Completion',
  traceId: 'trace-' + Date.now(),
  metadata: { model: 'gpt-4' }
});

await client.traces.createSpan(trace.id, {
  name: 'OpenAI API Call',
  type: 'llm',
  input: 'What is AI?',
  output: 'AI stands for Artificial Intelligence...',
  metadata: { tokens: 150, latency_ms: 1200 }
});`

  const evaluationCode = `const result = await client.evaluations.create({
  datasetId: 'public-demo-chatbot',
  metrics: ['factuality', 'toxicity']
});

console.log('Overall:', result.overall);`

  const ciCode = `if (result.overall < 0.85) {
  console.error('Regression detected:', result.overall);
  process.exit(1);
}`

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            AI Evaluation Platform
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/api-reference">
              <Button variant="ghost" size="sm">
                API Reference
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl p-6 w-full">
        <div className="space-y-8">
          {/* Hero */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">SDK Quick Start</h1>
            <p className="text-xl text-muted-foreground">
              Get started with the AI Evaluation Platform SDK in minutes
            </p>
          </div>

          {/* Install */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Install</h2>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto relative group">
              <pre><code>{installCode}</code></pre>
              <div className="absolute top-2 right-2">
                <CopyButton code={installCode} />
              </div>
            </div>
          </section>

          {/* Initialize */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Initialize</h2>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto relative group">
              <pre><code>{initCode}</code></pre>
              <div className="absolute top-2 right-2">
                <CopyButton code={initCode} />
              </div>
            </div>
          </section>

          {/* Create Trace + Span */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Create Trace + Span</h2>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto relative group">
              <pre><code>{traceCode}</code></pre>
              <div className="absolute top-2 right-2">
                <CopyButton code={traceCode} />
              </div>
            </div>
          </section>

          {/* Run an Evaluation */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Run an Evaluation</h2>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto relative group">
              <pre><code>{evaluationCode}</code></pre>
              <div className="absolute top-2 right-2">
                <CopyButton code={evaluationCode} />
              </div>
            </div>
          </section>

          {/* CI Assert */}
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">CI Assert</h2>
            <p className="text-muted-foreground">
              Prevent quality regressions in your CI/CD pipeline
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto relative group">
              <pre><code>{ciCode}</code></pre>
              <div className="absolute top-2 right-2">
                <CopyButton code={ciCode} />
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Next Steps</h3>
              <div className="grid gap-3">
                <Link href="/api-reference">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full API Reference
                  </Button>
                </Link>
                <Link href="/guides">
                  <Button variant="outline" className="w-full justify-start">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Integration Guides
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    Sign Up & Get API Key
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
