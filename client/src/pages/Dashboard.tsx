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
import CountUp from "react-countup";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <Layout title={`Welcome back, ${user?.firstName}!`} subtitle="Let's continue building your career path">
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl">
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
      <div className="space-y-8">
        {/* Career Progress Section */}
        <h3 className="text-lg font-semibold text-muted-foreground">Career Progress</h3>
        
        {/* Stacked Cards */}
        <div className="flex flex-col space-y-6">
          {/* RMS Score Card */}
          <Card className="hover:shadow-xl transition-all transform hover:scale-[1.01] border-l-4 border-l-indigo-500 rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Resume Match Score</p>
                  <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    <CountUp end={(stats as any)?.rmsScore || 0} duration={1.2} />
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
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
          <Card className="hover:shadow-xl transition-all transform hover:scale-[1.01] border-l-4 border-l-pink-500 rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-3xl font-extrabold text-pink-600 dark:text-pink-400">
                    <CountUp end={(stats as any)?.applicationsCount || 0} duration={1.2} />
                  </p>
                </div>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-accent font-medium">{(stats as any)?.pendingApplications || 0}</span>
                <span className="text-muted-foreground">pending •</span>
                <span className="text-green-600 font-medium">{(stats as any)?.interviewingCount || 0}</span>
                <span className="text-muted-foreground">interviewing</span>
              </div>
            </CardContent>
          </Card>

          {/* Roadmap Progress Card */}
          <Card className="hover:shadow-xl transition-all transform hover:scale-[1.01] border-l-4 border-l-green-500 rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Roadmap Progress</p>
                  <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                    <CountUp end={(stats as any)?.roadmapProgress || 0} duration={1.2} />%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Route className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <Progress value={(stats as any)?.roadmapProgress || 0} className="h-2" />
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-indigo-900/20 dark:via-purple-900/20 shadow-lg border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-2xl transition-all rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-indigo-700 dark:text-indigo-300">AI Insights 💡</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats as any)?.aiInsights?.topRecommendations ? (
                  <>
                    {(stats as any).aiInsights.topRecommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-3 bg-card/60 rounded-lg hover:bg-accent/10 transition-colors" data-testid={`card-ai-insight-${index}`}>
                        <p className="text-sm text-foreground mb-2 flex items-center gap-2">
                          <Target className="inline w-4 h-4 text-indigo-500" />
                          <strong data-testid={`text-ai-insight-category-${index}`}>{rec.category}</strong>
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
                  <div className="p-3 bg-card/60 rounded-lg">
                    <p className="text-sm text-foreground mb-2 flex items-center gap-2">
                      <Target className="inline w-4 h-4 text-indigo-500" />
                      <strong>Resume Score</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {(stats as any)?.rmsScore >= 70
                        ? `🚀 Excellent score! Consider applying to ${(stats as any)?.applicationStats?.pending + 2 || 3} more positions this week.`
                        : (stats as any)?.rmsScore >= 50
                        ? `💡 Good progress! Adding technical skills could boost your score by 15-20%.`
                        : `📄 Upload your resume to get personalized recommendations and improve your match score.`}
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

