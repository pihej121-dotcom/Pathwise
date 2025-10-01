import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const verifyPaymentAndLogin = async () => {
      try {
        // Get session_id from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          setError("No payment session found");
          setIsProcessing(false);
          return;
        }

        // Verify payment and get login token
        const response = await fetch('/api/stripe/verify-and-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }

        // Save token and redirect to dashboard
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          
          // Show success briefly before redirect
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          setError("Login failed after payment");
          setIsProcessing(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to complete registration");
        setIsProcessing(false);
      }
    };

    verifyPaymentAndLogin();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>
            {isProcessing ? "Completing your registration..." : "Your subscription is active"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Setting up your account...</p>
              </div>
            </div>
          )}

          {!isProcessing && !error && (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-lg font-medium">All set! Redirecting to dashboard...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
