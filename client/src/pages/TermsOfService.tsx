import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center" data-testid="title-terms">
              Terms of Service
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2" data-testid="text-last-updated">
              Last Updated: October 3, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section data-testid="section-introduction">
              <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to Pathwise. By accessing or using our platform, you agree to be bound by these Terms of Service. 
                Pathwise provides career development tools, AI-powered guidance, and resources to help students and 
                professionals advance their careers. Please read these terms carefully before using our services.
              </p>
            </section>

            <section data-testid="section-user-accounts">
              <h2 className="text-2xl font-semibold mb-3">2. User Accounts</h2>
              <p className="text-muted-foreground mb-2">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Use the platform only for lawful purposes</li>
              </ul>
            </section>

            <section data-testid="section-subscription">
              <h2 className="text-2xl font-semibold mb-3">3. Subscription Terms</h2>
              <p className="text-muted-foreground mb-2">
                Pathwise offers both free and paid subscription tiers:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Free Tier:</strong> Access to basic features including resume analysis and AI career co-pilot</li>
                <li><strong>Pro Tier:</strong> Full access to all features for $10/month, billed monthly</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>Refunds are provided on a case-by-case basis within 7 days of purchase</li>
                <li>We reserve the right to modify pricing with 30 days notice to existing subscribers</li>
              </ul>
            </section>

            <section data-testid="section-data-usage">
              <h2 className="text-2xl font-semibold mb-3">4. Data Usage</h2>
              <p className="text-muted-foreground mb-2">
                We collect and use your data to provide and improve our services:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Resume content is analyzed using AI to provide personalized feedback</li>
                <li>Career preferences help us match you with relevant opportunities</li>
                <li>Usage analytics help us improve the platform</li>
                <li>We do not sell your personal data to third parties</li>
                <li>You retain ownership of all content you upload</li>
                <li>We may use anonymized, aggregated data for research and improvement</li>
              </ul>
            </section>

            <section data-testid="section-intellectual-property">
              <h2 className="text-2xl font-semibold mb-3">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All platform content, features, and functionality are owned by Pathwise and protected by intellectual 
                property laws. You may not copy, modify, distribute, or reverse engineer any part of our platform. 
                AI-generated feedback and recommendations are provided for your personal use only. You retain all rights 
                to content you upload, but grant us a license to use it solely to provide our services.
              </p>
            </section>

            <section data-testid="section-liability">
              <h2 className="text-2xl font-semibold mb-3">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Pathwise is provided "as is" without warranties of any kind. We strive for accuracy but cannot guarantee 
                that AI-generated advice will lead to specific outcomes. Career decisions remain your responsibility. 
                We are not liable for any indirect, incidental, or consequential damages arising from your use of the 
                platform. Our total liability is limited to the amount you paid for the service in the past 12 months.
              </p>
            </section>

            <section data-testid="section-changes">
              <h2 className="text-2xl font-semibold mb-3">7. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms of Service periodically. We will notify users of material changes via email 
                or platform notification at least 30 days before they take effect. Continued use of the platform after 
                changes indicates acceptance of the updated terms. If you disagree with changes, you may cancel your 
                subscription and discontinue use of the platform.
              </p>
            </section>

            <section className="border-t pt-6 mt-8" data-testid="section-contact">
              <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms of Service, please contact us through our{" "}
                <a href="/contact" className="text-primary hover:underline" data-testid="link-contact">
                  Contact Page
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
