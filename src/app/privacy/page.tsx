import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
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

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 flex-1">
        {/* Hero */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Privacy Policy</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Last updated: January 15, 2024</p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              At AI Evaluation Platform ("we," "our," or "us"), we take your privacy seriously. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our platform and services.
            </p>
            <p className="text-muted-foreground">
              By using our services, you agree to the collection and use of information in 
              accordance with this policy. If you do not agree with our policies and practices, 
              please do not use our services.
            </p>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Information We Collect</h2>
            
            <h3 className="text-lg sm:text-xl font-semibold mb-3 mt-6">Personal Information</h3>
            <p className="text-muted-foreground mb-4">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Name and email address</li>
              <li>Company or organization name</li>
              <li>Billing and payment information (processed securely through Stripe)</li>
              <li>Account credentials (passwords are encrypted and never stored in plain text)</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold mb-3 mt-6">Usage Data</h3>
            <p className="text-muted-foreground mb-4">
              We automatically collect information about how you use our platform:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>API requests and responses</li>
              <li>Evaluation runs and test results</li>
              <li>Trace data and spans (LLM calls, tokens, latency)</li>
              <li>Browser type, IP address, and device information</li>
              <li>Pages visited, features used, and time spent on the platform</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold mb-3 mt-6">AI Content</h3>
            <p className="text-muted-foreground">
              When you use our evaluation and tracing features, we store:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>LLM inputs and outputs</li>
              <li>Test cases and expected results</li>
              <li>Annotation task data</li>
              <li>Judge model evaluations</li>
            </ul>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send billing information</li>
              <li>Send administrative information and service updates</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues or security vulnerabilities</li>
              <li>Develop new features and enhance user experience</li>
            </ul>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Data Storage and Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>All data is encrypted in transit using TLS 1.3</li>
              <li>Database encryption at rest using AES-256</li>
              <li>Regular security audits and penetration testing</li>
              <li>Role-based access controls and audit logging</li>
              <li>SOC 2 Type II certified infrastructure</li>
            </ul>
            <p className="text-muted-foreground">
              Your data is stored on secure servers located in the United States. 
              We use AWS and other trusted cloud providers with strict security standards.
            </p>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell, trade, or rent your personal information. We may share your 
              information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., payment processing, hosting)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to respond to legal process</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-4">You have the following rights regarding your data:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@aievalplatform.com" className="text-blue-500 hover:underline">privacy@aievalplatform.com</a>
            </p>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Improve our services and user experience</li>
            </ul>
            <p className="text-muted-foreground">
              You can control cookies through your browser settings. However, disabling cookies 
              may affect the functionality of our platform.
            </p>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for users under the age of 18. We do not knowingly 
              collect personal information from children. If you believe we have inadvertently 
              collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">International Data Transfers</h2>
            <p className="text-muted-foreground">
              If you are accessing our services from outside the United States, please note that 
              your information will be transferred to and processed in the United States. By using 
              our services, you consent to this transfer and processing.
            </p>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new policy on this page and updating the "Last 
              updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-sm mb-2">
                <strong>Email:</strong> <a href="mailto:privacy@aievalplatform.com" className="text-blue-500 hover:underline">privacy@aievalplatform.com</a>
              </p>
              <p className="text-sm mb-2">
                <strong>Address:</strong> AI Evaluation Platform, Inc.<br />
                123 Market Street, Suite 400<br />
                San Francisco, CA 94103
              </p>
              <p className="text-sm">
                <strong>Data Protection Officer:</strong> <a href="mailto:dpo@aievalplatform.com" className="text-blue-500 hover:underline">dpo@aievalplatform.com</a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}