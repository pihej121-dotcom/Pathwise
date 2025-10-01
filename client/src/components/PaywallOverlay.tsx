import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface PaywallOverlayProps {
  children: React.ReactNode;
  showPaywall: boolean;
  onUpgrade?: () => void;
}

export function PaywallOverlay({ children, showPaywall, onUpgrade }: PaywallOverlayProps) {
  if (!showPaywall) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center space-y-4 p-6 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Unlock with Pro</h3>
          <p className="text-muted-foreground">
            Get full access to detailed insights, improvement recommendations, and all premium features for just $10/month.
          </p>
          <Button 
            size="lg" 
            className="w-full group" 
            onClick={onUpgrade}
            data-testid="button-upgrade-to-pro"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  );
}
