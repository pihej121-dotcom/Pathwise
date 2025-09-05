import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

// Pages
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResumeAnalysis from "@/pages/ResumeAnalysis";
import CareerRoadmap from "@/pages/CareerRoadmap";
import JobMatching from "@/pages/JobMatching";
import { AICopilot } from "@/pages/AICopilot";
import Applications from "@/pages/Applications";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: () => JSX.Element, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (adminOnly && user.role !== "admin") {
    return <NotFound />;
  }
  
  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (user) {
    return <Dashboard />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      
      {/* Protected routes */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/resume" component={() => <ProtectedRoute component={ResumeAnalysis} />} />
      <Route path="/resume-analysis" component={() => <ProtectedRoute component={ResumeAnalysis} />} />
      <Route path="/roadmap" component={() => <ProtectedRoute component={CareerRoadmap} />} />
      <Route path="/career-roadmap" component={() => <ProtectedRoute component={CareerRoadmap} />} />
      <Route path="/jobs" component={() => <ProtectedRoute component={JobMatching} />} />
      <Route path="/job-matching" component={() => <ProtectedRoute component={JobMatching} />} />
      <Route path="/ai-copilot" component={() => <ProtectedRoute component={AICopilot} />} />
      <Route path="/applications" component={() => <ProtectedRoute component={Applications} />} />
      
      {/* Admin routes */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
