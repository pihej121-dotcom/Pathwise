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
import { InterviewPrep } from "@/pages/InterviewPrep";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, adminOnly = false, studentOnly = false }: { component: () => JSX.Element, adminOnly?: boolean, studentOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  
  // Debug logging
  console.log("ProtectedRoute:", { user, isLoading, adminOnly, studentOnly, userRole: user?.role });
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to Login");
    return <Login />;
  }
  
  if (adminOnly && user.role !== "admin" && user.role !== "super_admin") {
    console.log("ProtectedRoute: Admin required but user role is", user.role);
    return <NotFound />;
  }
  
  if (studentOnly && (user.role === "admin" || user.role === "super_admin")) {
    console.log("ProtectedRoute: Student required but user role is", user.role);
    return <NotFound />;
  }
  
  console.log("ProtectedRoute: Rendering component for user", user.role);
  return <Component />;
}

function RoleBasedHome() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  // Redirect admins to admin dashboard, students to student dashboard
  if (user.role === "admin" || user.role === "super_admin") {
    return <AdminDashboard />;
  }
  
  return <Dashboard />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (user) {
    return <RoleBasedHome />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      
      {/* Role-based home route */}
      <Route path="/" component={RoleBasedHome} />
      
      {/* Student-only routes */}
      <Route path="/resume" component={() => <ProtectedRoute component={ResumeAnalysis} studentOnly />} />
      <Route path="/resume-analysis" component={() => <ProtectedRoute component={ResumeAnalysis} studentOnly />} />
      <Route path="/roadmap" component={() => <ProtectedRoute component={CareerRoadmap} studentOnly />} />
      <Route path="/career-roadmap" component={() => <ProtectedRoute component={CareerRoadmap} studentOnly />} />
      <Route path="/jobs" component={() => <ProtectedRoute component={JobMatching} studentOnly />} />
      <Route path="/job-matching" component={() => <ProtectedRoute component={JobMatching} studentOnly />} />
      <Route path="/ai-copilot" component={() => <ProtectedRoute component={AICopilot} studentOnly />} />
      <Route path="/applications" component={() => <ProtectedRoute component={Applications} studentOnly />} />
      <Route path="/interview-prep" component={() => <ProtectedRoute component={InterviewPrep} studentOnly />} />
      
      {/* Admin routes - all redirect to main dashboard with appropriate tab */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      <Route path="/admin-dashboard" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      <Route path="/admin/invitations" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      <Route path="/admin/license" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      <Route path="/admin/settings" component={() => <ProtectedRoute component={AdminDashboard} adminOnly />} />
      
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
