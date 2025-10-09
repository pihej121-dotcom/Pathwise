import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TourButton } from "@/components/TourButton";
import { Briefcase, Sparkles } from "lucide-react";
import AIJobMatching from "@/pages/AIJobMatching";
import BeyondJobsTab from "@/pages/BeyondJobsTab";

export default function JobMatching({ embedded = false }: { embedded?: boolean }) {
  const [location, setLocation] = useLocation();
  
  // Check if we're on /beyond-jobs route or have tab query param
  const [, beyondJobsRoute] = useRoute("/beyond-jobs");
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  
  const defaultTab = beyondJobsRoute || tabParam === "beyond-jobs" ? "beyond-jobs" : "ai-matching";
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Update tab when route changes
  useEffect(() => {
    if (beyondJobsRoute) {
      setActiveTab("beyond-jobs");
    }
  }, [beyondJobsRoute]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL based on tab selection
    if (value === "beyond-jobs") {
      setLocation("/jobs?tab=beyond-jobs");
    } else {
      setLocation("/jobs");
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Matching</h1>
          <p className="text-muted-foreground mt-2">
            Find AI-matched jobs and explore experiential opportunities
          </p>
        </div>
        <TourButton tourId="job-matching" />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai-matching" className="flex items-center gap-2" data-testid="tab-ai-matching">
            <Briefcase className="h-4 w-4" />
            AI Job Matching
          </TabsTrigger>
          <TabsTrigger value="beyond-jobs" className="flex items-center gap-2" data-testid="tab-beyond-jobs">
            <Sparkles className="h-4 w-4" />
            Beyond Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-matching" className="mt-6">
          <AIJobMatching />
        </TabsContent>

        <TabsContent value="beyond-jobs" className="mt-6">
          <BeyondJobsTab />
        </TabsContent>
      </Tabs>
    </div>
  );

  return embedded ? content : (
    <Layout>
      {content}
    </Layout>
  );
}
