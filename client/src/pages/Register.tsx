import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@shared/schema";
import type { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string>("");
  
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
      await registerUser(data);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="@assets/Logo maker project_1757129739669.png" 
              alt="Pathwise Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="register-title">Create Account</CardTitle>
            <CardDescription>
              Start your career journey today
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
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-register"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
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
      </div>
    </div>
  );
}
