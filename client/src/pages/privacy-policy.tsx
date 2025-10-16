import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1
          className="text-4xl font-bold text-gray-900 mb-4"
          data-testid="text-privacy-title"
        >
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-8" data-testid="text-last-updated">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to <strong>LeadBoost</strong>. We respect your privacy and
              are committed to protecting your personal data. This Privacy
              Policy explains how we collect, use, and protect your information
              when you visit our platform. By using{" "}
              <a
                href="https://leadboostio.com"
                className="text-blue-600 hover:underline"
              >
                leadboostio.com
              </a>
              , you agree to this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Identity Data:</strong> First name, last name, username
                or similar identifier.
              </li>
              <li>
                <strong>Contact Data:</strong> Email address, billing address,
                and phone numbers.
              </li>
              <li>
                <strong>Technical Data:</strong> IP address, browser type and
                version, device information, and operating system.
              </li>
              <li>
                <strong>Usage Data:</strong> How you use our platform, products,
                and services.
              </li>
              <li>
                <strong>Marketing Data:</strong> Preferences for receiving
                marketing communications.
              </li>
              <li>
                <strong>Social Media Data:</strong> Data from connected accounts
                such as Instagram, Facebook, WhatsApp, TikTok, and others.
              </li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide and manage your account.</li>
              <li>Enable social media posting and analytics.</li>
              <li>Generate AI-powered content and campaign strategies.</li>
              <li>Process transactions and manage billing.</li>
              <li>
                Send updates, notifications, and marketing (with consent).
              </li>
              <li>Improve platform functionality and performance.</li>
              <li>Comply with legal requirements.</li>
            </ul>
          </section>

          {/* AI and Data Processing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              AI and Data Processing
            </h2>
            <p className="text-gray-700 leading-relaxed">
              LeadBoost uses artificial intelligence (powered by OpenAI) to
              generate marketing strategies and creative content. Your business
              data and preferences are processed securely and used solely to
              improve your experience. We comply with all relevant data
              protection laws.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To provide full functionality, we integrate with the following
              services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Authentication:</strong> Firebase, Google, Microsoft,
                Apple
              </li>
              <li>
                <strong>Social Media Platforms:</strong> Meta (Facebook,
                Instagram), WhatsApp, TikTok, and others
              </li>
              <li>
                <strong>AI Services:</strong> OpenAI for content generation
              </li>
              <li>
                <strong>Cloud Storage:</strong> Cloudinary for image and media
                storage
              </li>
              <li>
                <strong>Database:</strong> Neon PostgreSQL for secure data
                storage
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use encryption, HTTPS connections, and restricted access
              controls to protect your personal data. Access is limited to
              authorized employees and service providers who need it to perform
              their duties.
            </p>
          </section>

          {/* Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Rights
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Request access to your personal data.</li>
              <li>Request correction or deletion.</li>
              <li>Withdraw consent at any time.</li>
              <li>Object to or restrict processing.</li>
              <li>Request data portability.</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, email us at{" "}
              <a
                href="mailto:privacy@leadboostio.com"
                className="text-blue-600 hover:underline"
              >
                privacy@leadboostio.com
              </a>
              .
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cookies and Tracking
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies (including Meta Pixel) to
              analyze traffic, personalize content, and optimize ads. You can
              manage or disable cookies in your browser settings.
            </p>
          </section>

          {/* Meta Disclosure */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Meta Platform Data Usage & Deletion
            </h2>
            <p className="text-gray-700 leading-relaxed">
              LeadBoost uses Meta technologies (including Facebook and Instagram
              Graph APIs and Meta Pixel) to manage automation, messaging, and
              analytics. We only access data necessary to provide these
              services, and we do not sell or share this information. You may
              revoke access or request data deletion by emailing{" "}
              <a
                href="mailto:privacy@leadboostio.com"
                className="text-blue-600 hover:underline"
              >
                privacy@leadboostio.com
              </a>{" "}
              or removing the app from your Facebook Business Integrations.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Us
            </h2>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:privacy@leadboostio.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@leadboostio.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong>{" "}
                <a
                  href="https://leadboostio.com"
                  className="text-blue-600 hover:underline"
                >
                  https://leadboostio.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} LeadBoost. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
