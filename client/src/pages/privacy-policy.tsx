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
        <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-8" data-testid="text-last-updated">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to CampAIgner. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our 
              platform and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect, use, and store different kinds of personal data about you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Identity Data:</strong> First name, last name, username or similar identifier</li>
              <li><strong>Contact Data:</strong> Email address, billing address, and phone numbers</li>
              <li><strong>Technical Data:</strong> IP address, browser type and version, device information, and operating system</li>
              <li><strong>Usage Data:</strong> Information about how you use our platform, products, and services</li>
              <li><strong>Marketing Data:</strong> Your preferences in receiving marketing from us and your communication preferences</li>
              <li><strong>Social Media Data:</strong> Information from connected social media accounts (Instagram, WhatsApp, Facebook, TikTok, etc.)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use your personal data for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>To provide and maintain our social media management services</li>
              <li>To manage your account and provide customer support</li>
              <li>To process your transactions and manage billing</li>
              <li>To generate AI-powered content and marketing strategies</li>
              <li>To publish content to your connected social media platforms</li>
              <li>To analyze and improve our services</li>
              <li>To send you service updates, marketing communications, and newsletters (with your consent)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* AI and Data Processing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI and Data Processing</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform uses artificial intelligence (powered by OpenAI) to generate content strategies and marketing 
              materials. Your business data and preferences are processed by our AI systems to create personalized content 
              plans. We ensure that all AI processing complies with data protection regulations and your data is handled securely.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We integrate with various third-party services to provide our platform functionality:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Authentication:</strong> Firebase, Google, Microsoft, Apple for secure login</li>
              <li><strong>Social Media Platforms:</strong> Instagram, Facebook, WhatsApp, TikTok, and other platforms (21+ total)</li>
              <li><strong>AI Services:</strong> OpenAI for content generation and analysis</li>
              <li><strong>Cloud Storage:</strong> Cloudinary for image and media storage</li>
              <li><strong>Maps:</strong> Google Maps for address autocomplete</li>
              <li><strong>Database:</strong> Neon PostgreSQL for secure data storage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Each of these services has its own privacy policy. We recommend reviewing their privacy policies 
              to understand how they handle your data.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We have put in place appropriate security measures to prevent your personal data from being accidentally 
              lost, used, or accessed in an unauthorized way. We use encryption, secure servers, and follow industry 
              best practices to protect your information. Access to your personal data is limited to employees and 
              service providers who need it to perform their duties.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under data protection laws, you have rights including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of processing your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
              including for the purposes of satisfying any legal, accounting, or reporting requirements. When we no longer 
              need your data, we will securely delete or anonymize it.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our platform and store certain information. 
              Cookies are files with small amounts of data that are sent to your browser from a website and stored on your device. 
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          {/* International Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and maintained on computers located outside of your state, province, 
              country, or other governmental jurisdiction where data protection laws may differ. We ensure that appropriate 
              safeguards are in place for such transfers.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform is not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you become aware that a child has provided us with personal data, 
              please contact us so we can take appropriate action.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy 
              Policy periodically for any changes.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy or want to exercise your privacy rights, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> <a href="mailto:privacy@campaigner.com" className="text-blue-600 hover:underline">privacy@campaigner.com</a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} CampAIgner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
