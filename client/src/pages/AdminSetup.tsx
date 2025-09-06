import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { Link } from "wouter";

export default function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: "",
    institutionDomain: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.institutionName || !formData.institutionDomain || !formData.firstName || 
        !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error", 
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institutionName: formData.institutionName,
          institutionDomain: formData.institutionDomain,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setIsSetupComplete(true);
        toast({
          title: "Success",
          description: "Admin account created successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Setup failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Logo className="mx-auto mb-4" />
            <CardTitle className="text-2xl">Setup Complete!</CardTitle>
            <CardDescription>
              Your admin account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You can now sign in with your admin credentials.
              </p>
              <Link href="/login">
                <Button className="w-full">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Logo className="mx-auto mb-4" />
          <CardTitle className="text-2xl">Create Admin Account</CardTitle>
          <CardDescription>
            Set up your institution and admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Institution Details</h3>
              <div>
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  name="institutionName"
                  placeholder="University of Example"
                  value={formData.institutionName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="institutionDomain">Institution Domain</Label>
                <Input
                  id="institutionDomain"
                  name="institutionDomain"
                  placeholder="example.edu"
                  value={formData.institutionDomain}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Admin Account</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.edu"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter a secure password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Admin Account"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}