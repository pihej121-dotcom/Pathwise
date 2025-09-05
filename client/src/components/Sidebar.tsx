import { Link, useLocation } from "wouter";
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
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Resume Analysis", href: "/resume", icon: FileText },
  { name: "Career Roadmap", href: "/roadmap", icon: Route },
  { name: "Job Matching", href: "/jobs", icon: Briefcase },
  { name: "AI Copilot", href: "/ai-copilot", icon: Wand2 },
  { name: "Applications", href: "/applications", icon: CheckSquare },
  { name: "Interview Prep", href: "/interview-prep", icon: MessageSquare },
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
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <i className="fas fa-map-signs text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Pathwise</h1>
            <p className="text-xs text-muted-foreground">Institution Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <a className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md transition-all
                    ${isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                    <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white font-semibold text-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="user-major">
              {user?.major || "Student"}
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
