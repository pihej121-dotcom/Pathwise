import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/Logo";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@shared/schema";
import type { z } from "zod";
import { Check, Sparkles } from "lucide-react";

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "paid" | null>(null);
  const [, setLocation] = useLocation();
  
  // Extract invitation token from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const invitationToken = urlParams.get('invitationToken') || urlParams.get('token');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      invitationToken: invitationToken || undefined,
    },
  });

  // Set invitation token when component mounts
  useEffect(() => {
    if (invitationToken) {
      setValue('invitationToken', invitationToken);
    }
  }, [invitationToken, setValue]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError("");
      
      // Add selected plan to registration data
      const registrationData = {
        ...data,
        selectedPlan: selectedPlan || 'free', // Default to free if not selected (invitation flow)
      };
      
      // Call register API directly to get the response
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // If paid user, redirect to Stripe checkout
      if (result.requiresPayment && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      // For free/institutional users, save token and login
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  // If invitation token exists, skip plan selection
  const showPlanSelection = !invitationToken && selectedPlan === null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <Logo size="lg" className="mx-auto" />
        </div>

        {showPlanSelection ? (
          // Plan Selection Cards
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">Start with our free tier or unlock all features</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <Card className="relative border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedPlan("free")} data-testid="card-free-plan">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Free</span>
                    <span className="text-3xl font-bold">$0</span>
                  </CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm">Resume Analysis with AI feedback</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm">AI Career Co-Pilot chat assistance</span>
                    </div>
                    <div className="flex items-start gap-2 opacity-40">
                      <span className="w-5 h-5" />
                      <span className="text-sm line-through">Career Roadmaps</span>
                    </div>
                    <div className="flex items-start gap-2 opacity-40">
                      <span className="w-5 h-5" />
                      <span className="text-sm line-through">Job Matching</span>
                    </div>
                    <div className="flex items-start gap-2 opacity-40">
                      <span className="w-5 h-5" />
                      <span className="text-sm line-through">Micro-Projects</span>
                    </div>
                    <div className="flex items-start gap-2 opacity-40">
                      <span className="w-5 h-5" />
                      <span className="text-sm line-through">Application Tracking</span>
                    </div>
                  </div>
                  <Button className="w-full" data-testid="button-select-free">
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>

              {/* Paid Plan */}
              <Card className="relative border-2 border-primary hover:border-primary/80 transition-colors cursor-pointer" onClick={() => setSelectedPlan("paid")} data-testid="card-paid-plan">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pro</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold">$10</div>
                      <div className="text-sm text-muted-foreground font-normal">/month</div>
                    </div>
                  </CardTitle>
                  <CardDescription>Full access to all features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm font-medium">Everything in Free, plus:</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm">Personalized Career Roadmaps</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm">AI-Powered Job Matching</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm">Portfolio Micro-Projects</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm">Application Tracking System</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm">Beyond Jobs opportunities</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90" data-testid="button-select-paid">
                    Start Pro Trial
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login">
                  <a className="text-primary hover:underline" data-testid="link-login">
                    Sign in here
                  </a>
                </Link>
              </p>
            </div>
          </div>
        ) : (
          // Registration Form
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle data-testid="register-title">Create Account</CardTitle>
              <CardDescription>
                {selectedPlan === "paid" ? "Start your Pro subscription" : "Start your career journey today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {invitationToken && (
                  <Alert className="border-green-200 bg-green-50 text-green-800" data-testid="invitation-banner">
                    <AlertDescription>
                      ✅ You're registering with an invitation. Complete the form below to create your account.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedPlan && !invitationToken && (
                  <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                    <AlertDescription>
                      Selected plan: <strong>{selectedPlan === "paid" ? "Pro ($10/month)" : "Free"}</strong>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => setSelectedPlan(null)}
                        className="underline hover:no-underline"
                        data-testid="button-change-plan"
                      >
                        Change plan
                      </button>
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" data-testid="register-error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Hidden field for invitation token */}
                <input type="hidden" {...register('invitationToken')} data-testid="input-invitation-token" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      {...register("firstName")}
                      data-testid="input-first-name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      {...register("lastName")}
                      data-testid="input-last-name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@university.edu"
                    {...register("email")}
                    data-testid="input-email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    {...register("password")}
                    data-testid="input-password"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    data-testid="input-confirm-password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Optional Profile Fields */}
                <div className="space-y-2">
                  <Label htmlFor="school">School (Optional)</Label>
                  <Input
                    id="school"
                    placeholder="University of Example"
                    {...register("school")}
                    data-testid="input-school"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major (Optional)</Label>
                  <Input
                    id="major"
                    placeholder="Computer Science"
                    {...register("major")}
                    data-testid="input-major"
                  />
                </div>

                {/* Promo Code - only show for paid plan */}
                {selectedPlan === "paid" && (
                  <div className="space-y-2">
                    <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                    <Input
                      id="promoCode"
                      placeholder="Enter promo code"
                      {...register("promoCode")}
                      data-testid="input-promo-code"
                    />
                    {errors.promoCode && (
                      <p className="text-sm text-destructive">{errors.promoCode.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Have a promo code? Enter it to bypass payment.
                    </p>
                  </div>
                )}

                {/* Terms Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required data-testid="checkbox-terms" />
                  <Label 
                    htmlFor="terms" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-register"
                >
                  {isSubmitting ? "Creating account..." : selectedPlan === "paid" ? "Continue to Payment" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login">
                    <a className="text-primary hover:underline" data-testid="link-login">
                      Sign in here
                    </a>
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
