import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Checkout() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      // Not logged in, redirect to register
      setLocation('/register');
      return;
    }

    if (user && user.subscriptionTier === 'paid' && user.subscriptionStatus === 'incomplete') {
      // User needs to complete payment - create checkout session
      createCheckoutSession();
    } else if (user && user.subscriptionTier === 'paid' && user.subscriptionStatus === 'active') {
      // Already paid, redirect to dashboard
      setLocation('/dashboard');
    } else if (user && user.subscriptionTier === 'free') {
      // Free user trying to access checkout?
      setLocation('/dashboard');
    }
  }, [user, authLoading, setLocation]);

  const createCheckoutSession = async () => {
    if (isCreatingCheckout) return;
    
    setIsCreatingCheckout(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", {});
      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError("Failed to create checkout session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create checkout session");
      setIsCreatingCheckout(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Complete Your Subscription</CardTitle>
          <CardDescription>
            You're almost there! Complete your payment to unlock all features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center py-6">
            {isCreatingCheckout ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Redirecting to secure checkout...</p>
              </div>
            ) : error ? (
              <Button onClick={createCheckoutSession} data-testid="button-retry-checkout">
                Retry Payment
              </Button>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
