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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Resume Score</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="rms-score">
                  {(stats as any)?.rmsScore || 0}
                </p>
              </div>
              <ProgressRing progress={(stats as any)?.rmsScore || 0} size={50} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Applications</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="applications-count">
                  {(stats as any)?.applicationsCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Roadmap</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="roadmap-progress">
                  {(stats as any)?.roadmapProgress || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Route className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card 
          className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard === 'resume' ? 'ring-2 ring-blue-500 shadow-lg' : ''}`} 
          onClick={() => setSelectedCard('resume')} 
          data-testid="card-resume"
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Resume</h3>
            <p className="text-xs text-muted-foreground">Analyze & optimize</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard === 'roadmap' ? 'ring-2 ring-green-500 shadow-lg' : ''}`} 
          onClick={() => setSelectedCard('roadmap')} 
          data-testid="card-roadmap"
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Route className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Roadmap</h3>
            <p className="text-xs text-muted-foreground">Career planning</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard === 'jobs' ? 'ring-2 ring-purple-500 shadow-lg' : ''}`} 
          onClick={() => setSelectedCard('jobs')} 
          data-testid="card-jobs"
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">Jobs</h3>
            <p className="text-xs text-muted-foreground">Find opportunities</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard === 'projects' ? 'ring-2 ring-orange-500 shadow-lg' : ''}`} 
          onClick={() => setSelectedCard('projects')} 
          data-testid="card-projects"
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-1">Projects</h3>
            <p className="text-xs text-muted-foreground">Build portfolio</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard === 'copilot' ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`} 
          onClick={() => setSelectedCard('copilot')} 
          data-testid="card-copilot"
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold mb-1">AI Copilot</h3>
            <p className="text-xs text-muted-foreground">Get AI guidance</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard === 'applications' ? 'ring-2 ring-pink-500 shadow-lg' : ''}`} 
          onClick={() => setSelectedCard('applications')} 
          data-testid="card-applications"
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <ListTodo className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-semibold mb-1">Applications</h3>
            <p className="text-xs text-muted-foreground">Track progress</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard === 'interview' ? 'ring-2 ring-cyan-500 shadow-lg' : ''}`} 
          onClick={() => setSelectedCard('interview')} 
          data-testid="card-interview"
        >
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="font-semibold mb-1">Interview Prep</h3>
            <p className="text-xs text-muted-foreground">Practice & prepare</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(activities as any[]).slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 p-2 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {(activities as any[]).length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              <span>AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats as any)?.aiInsights?.topRecommendations ? (
                (stats as any).aiInsights.topRecommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">
                      <Target className="inline w-4 h-4 mr-1" />
                      {rec.category}
                    </p>
                    <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                      {rec.priority.toUpperCase()} (+{rec.impact} pts)
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm mb-2">
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
                      variant="outline" 
                      onClick={() => setSelectedCard('resume')}
                    >
                      Upload Resume
                    </Button>
                  )}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full" 
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
          {selectedCard === 'resume' && <ResumeAnalysis embedded={true} />}
          {selectedCard === 'roadmap' && <CareerRoadmap embedded={true} />}
          {selectedCard === 'jobs' && <JobMatching embedded={true} />}
          {selectedCard === 'projects' && <MicroProjects embedded={true} />}
          {selectedCard === 'copilot' && <AICopilot embedded={true} />}
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
