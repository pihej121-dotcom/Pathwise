import { createContext, useContext, useState, useCallback } from "react";
import Shepherd from "shepherd.js";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import "shepherd.js/dist/css/shepherd.css";

type TourContextType = {
  startTour: (tourId: string) => void;
  completeTour: (tourId: string) => Promise<void>;
  isTourCompleted: (tourId: string) => boolean;
  completedTours: Set<string>;
  isLoading: boolean;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Use React Query to fetch tour status
  const { data: tourData, isLoading } = useQuery<{ completedTours: string[] }>({
    queryKey: ["/api/tours/status"],
    enabled: !!user,
  });

  const completedTours = new Set<string>(tourData?.completedTours || []);

  const startTour = useCallback((tourId: string) => {
    // Tours are started by components that have access to the tour configuration
    // This is just a placeholder that can be extended if needed
    console.log(`Starting tour: ${tourId}`);
  }, []);

  const completeTour = useCallback(async (tourId: string) => {
    try {
      await apiRequest("POST", "/api/tours/complete", { tourId });
      
      // Invalidate the tour status query to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/tours/status"] });
    } catch (error) {
      console.error("Failed to mark tour as completed:", error);
    }
  }, []);

  const isTourCompleted = useCallback(
    (tourId: string) => {
      return completedTours.has(tourId);
    },
    [completedTours]
  );

  return (
    <TourContext.Provider
      value={{
        startTour,
        completeTour,
        isTourCompleted,
        completedTours,
        isLoading,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

// Export Shepherd for use in tour configurations
export { Shepherd };
