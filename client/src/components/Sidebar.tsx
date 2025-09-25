import { Link, useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  FileText, 
  Route, 
  Briefcase, 
  Wand2, 
  CheckSquare, 
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  UserPlus,
  Crown,
  Zap
} from "lucide-react";

const studentNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Resume Analysis", href: "/resume", icon: FileText },
  { name: "Career Roadmap", href: "/roadmap", icon: Route },
  { name: "Job Matching", href: "/jobs", icon: Briefcase },
  { name: "Opportunity Radar", href: "/opportunity-radar", icon: Zap },
  { name: "AI Copilot", href: "/ai-copilot", icon: Wand2 },
  { name: "Applications", href: "/applications", icon: CheckSquare },
  { name: "Interview Prep", href: "/interview-prep", icon: MessageSquare },
];

const adminNavigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Shield },
  { name: "Invitations", href: "/admin/invitations", icon: UserPlus },
  { name: "License Management", href: "/admin/license", icon: Crown },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen">
      {/* Logo & Institution */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col items-center text-center space-y-1">
          <Logo size="md" />
          <p className="text-xs text-muted-foreground">Institution Edition</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {/* Show student navigation for students only */}
          {(() => {
            const userRole = user?.role;
            return userRole === "student";
          })() && studentNavigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md transition-all
                    ${isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                </Link>
              </li>
            );
          })}
          
          {/* Show admin navigation for admins only */}
          {(() => {
            const userRole = user?.user?.role || user?.role;
            return userRole === "admin" || userRole === "super_admin";
          })() && (
            <>
              <li className="mb-2">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-3">INSTITUTIONAL MANAGEMENT</p>
              </li>
              {adminNavigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-md transition-all
                        ${isActive 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white font-semibold text-sm">
              {getInitials(user?.user?.firstName || user?.firstName, user?.user?.lastName || user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="user-name">
              {user?.user?.firstName || user?.firstName} {user?.user?.lastName || user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="user-major">
              {(() => {
                const userRole = user?.user?.role || user?.role;
                return userRole === "admin" || userRole === "super_admin" 
                  ? userRole === "super_admin" ? "Super Admin" : "Admin"
                  : user?.user?.major || user?.major || "Student";
              })()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-1"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
