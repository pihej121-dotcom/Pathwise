import { useAuth } from "@/hooks/use-auth";
import { DropdownNav } from "./DropdownNav";
import { Button } from "./ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/achievements"],
    refetchInterval: 30000,
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });

  const [lastAchievementCount, setLastAchievementCount] = useState(0);

  useEffect(() => {
    if (achievements && achievements.length > lastAchievementCount) {
      const newAchievement = achievements[0]; // Most recent
      toast({
        title: "Achievement Unlocked! 🎉",
        description: `${newAchievement.title}: ${newAchievement.description}`
      });
      setLastAchievementCount(achievements.length);
    }
  }, [achievements, lastAchievementCount, toast]);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle */}
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="sm"
        className="fixed top-4 right-20 z-50 rounded-full shadow-lg"
        data-testid="button-theme-toggle"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>

      <DropdownNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || subtitle) && (
          <header className="bg-card border-b border-border px-6 py-4 -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-2xl font-bold text-foreground"
                  data-testid="page-title"
                >
                  {title ?? `Welcome back, ${user?.firstName || "Guest"}!`}
                </h2>
                {subtitle && (
                  <p
                    className="text-muted-foreground"
                    data-testid="page-subtitle"
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {/* Streak Counter */}
                <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1 rounded-full">
                  <span className="text-orange-500">🔥</span>
                  <span
                    className="text-sm font-medium"
                    data-testid="streak-counter"
                  >
                    {dashboardStats?.streak || 0} day streak
                  </span>
                </div>
              </div>
            </div>
          </header>
        )}

        <div className="py-6">{children}</div>
      </main>
    </div>
  );
}
