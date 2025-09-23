import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ProgressRing";
import { 
  TrendingUp, 
  Send, 
  Route, 
  Wand2, 
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activitiesData = { recentActivities: [] } } = useQuery({
    queryKey: ["/api/activities"],
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const activities = (activitiesData as any)?.recentActivities || [];

  if (isLoading) {
    return (
      <Layout title={`Welcome back, ${user?.firstName}!`} subtitle="Let's continue building your career path">
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={`Welcome back, ${user?.firstName}!`} 
      subtitle="Let's continue building your career path"
    >
      <div className="space-y-6">
        {/* All stacked vertically */}
        <div className="flex flex-col space-y-6">
          {/* RMS Score Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Resume Match Score</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="rms-score">
                    {(stats as any)?.rmsScore || 0}
                  </p>
                </div>
                <ProgressRing progress={(stats as any)?.rmsScore || 0} />
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">
                  {(stats as any)?.rmsScoreImprovement > 0 ? '+' : ''}{(stats as any)?.rmsScoreImprovement || 0}
                </span>
                <span className="text-muted-foreground">
                  {(stats as any)?.rmsScoreImprovement > 0 ? 'improvement' : 'this month'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Applications Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="applications-count">
                    {(stats as any)?.applicationsCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-accent font-medium">{(stats as any)?.pendingApplications || 0}</span>
                <span className="text-muted-foreground">pending •</span>
                <span className="text-green-600 font-medium">{(stats as any)?.interviewingCount || 0}</span>
                <span className="text-muted-foreground">interviewing</span>
              </div>
            </CardContent>
          </Card>

          {/* Roadmap Progress Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Roadmap Progress</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="roadmap-progress">
                    {(stats as any)?.roadmapProgress || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Route className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <Progress value={(stats as any)?.roadmapProgress || 0} className="h-2" />
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats as any)?.aiInsights?.topRecommendations ? (
                  <>
                    {(stats as any).aiInsights.topRecommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-3 bg-card/60 rounded-lg" data-testid={`card-ai-insight-${index}`}>
                        <p className="text-sm text-foreground mb-2">
                          <Target className="inline w-4 h-4 mr-1" />
                          <strong data-testid={`text-ai-insight-category-${index}`}>{rec.category}:</strong>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                : rec.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            }`}
                            data-testid={`text-ai-insight-priority-${index}`}
                          >
                            {rec.priority.toUpperCase()} (+{rec.impact} pts)
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-ai-insight-rationale-${index}`}>
                          {rec.rationale}
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-card/60 rounded-lg">
                      <p className="text-sm text-foreground mb-2">
                        <Target className="inline w-4 h-4 mr-1" />
                        <strong>Resume Score:</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {(stats as any)?.rmsScore >= 70
                          ? `Excellent score! Consider applying to ${(stats as any)?.applicationStats?.pending + 2 || 3} more positions this week.`
                          : (stats as any)?.rmsScore >= 50
                          ? `Good progress! Adding technical skills could boost your score by 15-20%.`
                          : `Upload your resume to get personalized recommendations and improve your match score.`}
                      </p>
                      {(stats as any)?.rmsScore === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate("/resume")}
                          data-testid="button-run-analysis"
                        >
                          Upload Resume
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full mt-4"
                variant="secondary"
                data-testid="button-more-insights"
                onClick={() => navigate("/resume")}
              >
                Get More Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
