import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { Shield, GraduationCap, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { apiRequest } from "@/lib/queryClient";
import type { z } from "zod";

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [error, setError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState<boolean>(true);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Check if database needs setup on component mount
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await apiRequest('/api/admin/needs-setup');
        if (response.ok) {
          const data = await response.json();
          setNeedsSetup(data.needsSetup);
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const handleDemoLogin = async (email: string, password: string, accountType: string) => {
    try {
      setError("");
      setIsLoggingIn(true);
      setValue("email", email);
      setValue("password", password);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || `Demo ${accountType} login failed`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <Logo size="lg" className="mx-auto" />
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="login-title">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue your career journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="login-error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                  {...register("password")}
                  data-testid="input-password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoggingIn}
                data-testid="button-login"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Conditional content based on setup status */}
            {isCheckingSetup ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Checking system status...</p>
              </div>
            ) : needsSetup ? (
              /* Admin Setup Required */
              <div className="space-y-3">
                <p className="text-sm font-medium text-center text-muted-foreground">
                  Initial Setup Required
                </p>
                <div className="text-center">
                  <Link href="/admin-setup">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2 mx-auto"
                      data-testid="button-admin-setup"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Set up Admin Account</span>
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-2">
                    Create your institution and first admin account
                  </p>
                </div>
              </div>
            ) : (
              /* Demo Account Switcher */
              <div className="space-y-3">
                <p className="text-sm font-medium text-center text-muted-foreground">
                  Quick Demo Access
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center space-y-2 h-auto py-3"
                    disabled={isLoggingIn || isSubmitting}
                    onClick={() => handleDemoLogin("admin@demo-university.edu", "admin123", "Admin")}
                    data-testid="button-demo-admin"
                  >
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Demo Admin</p>
                      <p className="text-xs text-muted-foreground">Full licensing access</p>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center space-y-2 h-auto py-3"
                    disabled={isLoggingIn || isSubmitting}
                    onClick={() => handleDemoLogin("student@demo-university.edu", "student123", "Student")}
                    data-testid="button-demo-student"
                  >
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Demo Student</p>
                      <p className="text-xs text-muted-foreground">Standard user access</p>
                    </div>
                  </Button>
                </div>
                
                {isLoggingIn && (
                  <p className="text-sm text-center text-muted-foreground">
                    Logging in...
                  </p>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
