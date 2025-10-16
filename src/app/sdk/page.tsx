"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { Copy, Check, Terminal, Sparkles, Zap, Shield } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SDKPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const installCode = "npm install @your-org/ai-eval-sdk"
  
  const quickStartCode = `import { AIEvalClient } from '@your-org/ai-eval-sdk';

const client = new AIEvalClient({
  apiKey: process.env.EVALAI_API_KEY,
  projectId: process.env.EVALAI_PROJECT_ID
});

// Create a trace
const trace = await client.traces.create({
  name: 'User Query',
  input: { query: 'What is AI evaluation?' },
  output: { response: 'AI evaluation is...' }
});`

  const frameworkCode = `import { withOpenAI } from '@your-org/ai-eval-sdk/integrations/openai';

const openai = withOpenAI(new OpenAI(), {
  projectId: 'your-project-id'
});

// All OpenAI calls are now automatically traced
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});`

  const testSuiteCode = `import { createTestSuite } from '@your-org/ai-eval-sdk/testing';

const suite = createTestSuite({
  name: 'Chatbot Evaluation',
  cases: [
    {
      input: 'What is your return policy?',
      expectedOutput: /30-day|return|refund/i,
      assertions: ['containsKeywords', 'notContainsPII']
    }
  ]
});

await suite.run();`

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              AI Evaluation Platform
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/10 rounded-full">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">TypeScript SDK</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Evaluate AI with <span className="text-blue-500">confidence</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Production-ready SDK for tracing, testing, and monitoring your LLM applications.
              Built for developers who ship fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Get started free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/api-reference">View API docs</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6">
              <Terminal className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Zero Config</h3>
              <p className="text-muted-foreground">
                Auto-detects environment variables. Works out of the box with sensible defaults.
              </p>
            </Card>

            <Card className="p-6">
              <Zap className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Framework Integration</h3>
              <p className="text-muted-foreground">
                Drop-in wrappers for OpenAI, Anthropic, and LangChain. Automatic tracing enabled.
              </p>
            </Card>

            <Card className="p-6">
              <Shield className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Type Safe</h3>
              <p className="text-muted-foreground">
                Full TypeScript support with generics. Catch errors before runtime.
              </p>
            </Card>
          </div>

          {/* Installation */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Installation</h2>
            <div className="bg-muted/50 rounded-lg p-4 relative group">
              <pre className="font-mono text-sm overflow-x-auto">
                <code>{installCode}</code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyCode(installCode, "install")}
              >
                {copiedCode === "install" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Quick Start */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
            <div className="bg-muted/50 rounded-lg p-4 relative group">
              <pre className="font-mono text-sm overflow-x-auto">
                <code>{quickStartCode}</code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyCode(quickStartCode, "quickstart")}
              >
                {copiedCode === "quickstart" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Framework Integration */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Framework Integration</h2>
            <p className="text-muted-foreground mb-4">
              Automatically trace all LLM calls with zero-config wrappers:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 relative group">
              <pre className="font-mono text-sm overflow-x-auto">
                <code>{frameworkCode}</code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyCode(frameworkCode, "framework")}
              >
                {copiedCode === "framework" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Test Suite */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Test Suite Builder</h2>
            <p className="text-muted-foreground mb-4">
              Create comprehensive test suites with built-in assertions:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 relative group">
              <pre className="font-mono text-sm overflow-x-auto">
                <code>{testSuiteCode}</code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyCode(testSuiteCode, "testsuite")}
              >
                {copiedCode === "testsuite" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center py-16 border-t">
            <h2 className="text-3xl font-bold mb-4">Ready to start evaluating?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join developers who ship AI products with confidence
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Get started free</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}