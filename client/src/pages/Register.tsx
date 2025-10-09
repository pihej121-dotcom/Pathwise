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
import { Check, Sparkles, ArrowLeft } from "lucide-react";

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
      // Note: Backend ignores selectedPlan when invitationToken is provided (sets to "institutional")
      const registrationData = {
        ...data,
        selectedPlan: invitationToken ? undefined : (selectedPlan || 'paid'),
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
        {/* Back Button */}
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Logo */}
        <div className="text-center mb-6">
          <Logo size="lg" className="mx-auto" />
        </div>

        {showPlanSelection ? (
          // Registration Restricted - Invitation Only
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Registration Restricted</CardTitle>
              <CardDescription className="text-center">
                Registration is by invitation only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Pathwise is available through institutional partnerships or by paid subscription.
                  Please contact us if you'd like to bring Pathwise to your institution.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  If you have an invitation code, please use the link provided in your invitation email.
                </p>
                
                <div className="flex flex-col gap-2">
                  <Link href="/contact" className="w-full">
                    <Button variant="default" className="w-full" data-testid="button-contact">
                      Contact Us
                    </Button>
                  </Link>
                  
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full" data-testid="button-signin">
                      Already have an account? Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Registration Form
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle data-testid="register-title">Create Account</CardTitle>
              <CardDescription>
                {invitationToken ? "Complete your registration" : "Start your Pro subscription"}
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
                      Selected plan: <strong>Pro ($10/month)</strong>
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

                {/* Terms Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required data-testid="checkbox-terms" />
                  <Label 
                    htmlFor="terms" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                      data-testid="link-terms"
                    >
                      Terms of Service
                    </a>{" "}
                    and Privacy Policy
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-register"
                >
                  {isSubmitting ? "Creating account..." : invitationToken ? "Create Account" : "Continue to Payment"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline" data-testid="link-login-form">
                    Sign in here
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
