import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressRing } from "@/components/ProgressRing";
import { TourButton } from "@/components/TourButton";
import { 
  Send, 
  Route, 
  CheckCircle, 
  Clock, 
  Target,
  Wand2,
  FileText,
  Briefcase,
  Lightbulb,
  Brain,
  ListTodo,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// Import feature components
import ResumeAnalysis from "./ResumeAnalysis";
import CareerRoadmap from "./CareerRoadmap";
import JobMatching from "./JobMatching";
import MicroProjects from "./MicroProjects";
import { AICopilot } from "./AICopilot";
import Applications from "./Applications";
import { InterviewPrep } from "./InterviewPrep";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities?limit=4"],
    refetchInterval: 5000,
    staleTime: 3000,
  });

  if (isLoading) {
    return (
      <Layout title={`Welcome back, ${user?.firstName}!`} subtitle="Your career command center">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const OverviewContent = () => (
    <>
      <div className="flex justify-end mb-4">
        <TourButton 
          tourId="dashboard-welcome" 
          autoStart={true}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Resume Score</p>
                <p className="text-3xl font-semibold" data-testid="rms-score">
                  {(stats as any)?.rmsScore || 0}
                </p>
              </div>
              <ProgressRing progress={(stats as any)?.rmsScore || 0} size={48} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Applications</p>
                <p className="text-3xl font-semibold" data-testid="applications-count">
                  {(stats as any)?.applicationsCount || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Roadmap</p>
                <p className="text-3xl font-semibold" data-testid="roadmap-progress">
                  {(stats as any)?.roadmapProgress || 0}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <Route className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 mb-8">
        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all ${selectedCard === 'resume' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} 
          onClick={() => setSelectedCard('resume')} 
          data-testid="card-resume"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Resume</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all ${selectedCard === 'roadmap' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} 
          onClick={() => setSelectedCard('roadmap')} 
          data-testid="card-roadmap"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Route className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Roadmap</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all ${selectedCard === 'jobs' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} 
          onClick={() => setSelectedCard('jobs')} 
          data-testid="card-jobs"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Jobs</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all ${selectedCard === 'projects' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} 
          onClick={() => setSelectedCard('projects')} 
          data-testid="card-projects"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Projects</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all ${selectedCard === 'copilot' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} 
          onClick={() => setSelectedCard('copilot')} 
          data-testid="card-copilot"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">AI Copilot</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all ${selectedCard === 'applications' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} 
          onClick={() => setSelectedCard('applications')} 
          data-testid="card-applications"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <ListTodo className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Applications</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all ${selectedCard === 'interview' ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} 
          onClick={() => setSelectedCard('interview')} 
          data-testid="card-interview"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">Interview</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer border-none shadow-sm hover:shadow-md transition-all bg-foreground text-background ${selectedCard === 'copilot' ? 'ring-2 ring-foreground/20' : ''}`} 
          onClick={() => setSelectedCard('copilot')} 
          data-testid="card-ai-help"
        >
          <CardContent className="pt-6 pb-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center mx-auto mb-3">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm">AI Help</h3>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(activities as any[]).slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {(activities as any[]).length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats as any)?.aiInsights?.topRecommendations ? (
                (stats as any).aiInsights.topRecommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      {rec.category}
                    </p>
                    <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                      'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {rec.priority.toUpperCase()} +{rec.impact}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm mb-3">
                    {(stats as any)?.rmsScore >= 70 
                      ? `Excellent score! Keep applying to opportunities.`
                      : (stats as any)?.rmsScore >= 50 
                      ? `Good progress! Adding skills could boost your score.` 
                      : `Upload your resume to get personalized recommendations.`
                    }
                  </p>
                  {(stats as any)?.rmsScore === 0 && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8"
                      onClick={() => setSelectedCard('resume')}
                    >
                      Upload Resume
                    </Button>
                  )}
                </div>
              )}
              <Button 
                variant="ghost" 
                className="w-full h-9 mt-2" 
                onClick={() => setSelectedCard('copilot')}
              >
                <Brain className="w-4 h-4 mr-2" />
                Ask AI Copilot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Card Content */}
      {selectedCard && (
        <div className="mt-6">
          {selectedCard === 'resume analysis' && <ResumeAnalysis embedded={true} />}
          {selectedCard === 'career roadmap' && <CareerRoadmap embedded={true} />}
          {selectedCard === 'opportunity' && <JobMatching embedded={true} />}
          {selectedCard === 'projects' && <MicroProjects embedded={true} />}
          {selectedCard === 'ai career copilot' && <AICopilot embedded={true} />}
          {selectedCard === 'applications' && <Applications embedded={true} />}
          {selectedCard === 'interview' && <InterviewPrep embedded={true} />}
        </div>
      )}
    </>
  );

  return (
    <Layout 
      title={`Welcome back, ${user?.firstName}!`} 
      subtitle="Your career command center"
    >
      <OverviewContent />
    </Layout>
  );
}
