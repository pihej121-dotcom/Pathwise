import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useTour } from "@/contexts/TourContext";
import { tours, type TourConfig } from "@/lib/tours";
import Shepherd from "shepherd.js";
import { useEffect, useRef } from "react";

type TourButtonProps = {
  tourId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  autoStart?: boolean;
};

export function TourButton({ tourId, variant = "outline", size = "sm", className, autoStart = false }: TourButtonProps) {
  const { completeTour, isTourCompleted } = useTour();
  const tourRef = useRef<any>(null);
  const hasAutoStarted = useRef(false);

  const tourConfig = tours[tourId];
  
  if (!tourConfig) {
    console.error(`Tour configuration not found for: ${tourId}`);
    return null;
  }

  useEffect(() => {
    // Auto-start tour if requested and not completed
    if (autoStart && !hasAutoStarted.current && !isTourCompleted(tourId)) {
      hasAutoStarted.current = true;
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startTour();
      }, 500);
    }
  }, [autoStart, tourId, isTourCompleted]);

  const startTour = () => {
    // Clean up existing tour if any
    if (tourRef.current) {
      tourRef.current.complete();
      tourRef.current = null;
    }

    // Create new tour instance
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: {
          enabled: true,
        },
      },
    });

    // Add steps
    tourConfig.steps.forEach((step) => {
      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo as any,
        buttons: step.buttons as any,
      });
    });

    // Handle tour completion
    tour.on("complete", () => {
      completeTour(tourId);
      tourRef.current = null;
    });

    // Handle tour cancellation
    tour.on("cancel", () => {
      tourRef.current = null;
    });

    // Start the tour
    tour.start();
    tourRef.current = tour;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.complete();
      }
    };
  }, []);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={startTour}
      className={className}
      data-testid={`button-tour-${tourId}`}
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Take Tour
    </Button>
  );
}
