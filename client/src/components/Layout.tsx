import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"]
  });
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Theme Toggle */}
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 rounded-full shadow-lg"
        data-testid="button-theme-toggle"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>

      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        {(title || subtitle) && (
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">
                  {title || `Welcome back, ${user?.firstName}!`}
                </h2>
                {subtitle && (
                  <p className="text-muted-foreground" data-testid="page-subtitle">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">                
                {/* Streak Counter */}
                <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1 rounded-full">
                  <span className="text-orange-500">🔥</span>
                  <span className="text-sm font-medium" data-testid="streak-counter">
                    {dashboardStats?.streak || 0} day streak
                  </span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>


