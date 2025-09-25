import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ProgressRing";
import { 
  TrendingUp, 
  Send, 
  Route, 
  CheckCircle, 
  Play, 
  Clock, 
  Target,
  Wand2,
  AlertCircle,
  FileText,
  Briefcase
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities"],
    refetchInterval: 5000,
    staleTime: 3000,
  });

  if (isLoading) {
    return (
      <Layout title={`Welcome back, ${user?.firstName}!`} subtitle="Let's continue building your career path">
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

  return (
    <Layout 
      title={`Welcome back, ${user?.firstName}!`} 
      subtitle="Let's continue building your career path"
    >
      <div className="space-y-6">
        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 gap-6">
          {/* RMS Score Card */}
          <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 hover:scale-[1.02]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Resume Match Score</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100" data-testid="rms-score">
                    {(stats as any)?.rmsScore || 0}
                  </p>
                </div>
                <ProgressRing progress={(stats as any)?.rmsScore || 0} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">
                    {(stats as any)?.rmsScoreImprovement > 0 ? '+' : ''}{(stats as any)?.rmsScoreImprovement || 0}
                  </span>
                  <span className="text-blue-600/80 dark:text-blue-400/80">
                    {(stats as any)?.rmsScoreImprovement > 0 ? 'improvement' : 'this month'}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/resume')} className="bg-blue-500/10 border-blue-300 text-blue-700 hover:bg-blue-500/20">
                  Improve
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Applications Card */}
          <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 hover:scale-[1.02]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Applications</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100" data-testid="applications-count">
                    {(stats as any)?.applicationsCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-sm">
                  <span className="text-purple-600 font-medium">{(stats as any)?.pendingApplications || 0}</span>
                  <span className="text-purple-500/80">pending •</span>
                  <span className="text-green-600 font-medium">{(stats as any)?.interviewingCount || 0}</span>
                  <span className="text-purple-500/80">interviewing</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/applications')} className="bg-purple-500/10 border-purple-300 text-purple-700 hover:bg-purple-500/20">
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Roadmap Progress Card */}
          <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 hover:scale-[1.02]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Roadmap Progress</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100" data-testid="roadmap-progress">
                    {(stats as any)?.roadmapProgress || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Route className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mb-3">
                <Progress value={(stats as any)?.roadmapProgress || 0} className="h-3" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-green-600/80">
                  {(stats as any)?.roadmapProgress > 0 ? 'Great progress!' : 'Start your journey'}
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/roadmap')} className="bg-green-500/10 border-green-300 text-green-700 hover:bg-green-500/20">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <Card className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready to boost your career?</h3>
                <p className="text-white/90 text-sm">Take action to improve your profile</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="secondary" size="sm" onClick={() => navigate('/resume')} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <FileText className="w-4 h-4 mr-2" />
                Upload Resume
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/jobs')} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <Briefcase className="w-4 h-4 mr-2" />
                Find Jobs
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/roadmap')} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <Route className="w-4 h-4 mr-2" />
                Plan Career
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/ai-copilot')} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <Wand2 className="w-4 h-4 mr-2" />
                AI Help
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Recent Activities */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                      <p className="text-xs">Start using Pathwise to see your progress here!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Insights */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
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
                      {/* Show top recommendations from Resume Analysis */}
                      {(stats as any).aiInsights.topRecommendations.map((rec: any, index: number) => (
                        <div key={index} className="p-3 bg-card/60 rounded-lg" data-testid={`card-ai-insight-${index}`}>
                          <p className="text-sm text-foreground mb-2">
                            <Target className="inline w-4 h-4 mr-1" />
                            <strong data-testid={`text-ai-insight-category-${index}`}>{rec.category}:</strong>
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            }`} data-testid={`text-ai-insight-priority-${index}`}>
                              {rec.priority.toUpperCase()} (+{rec.impact} pts)
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-ai-insight-rationale-${index}`}>
                            {rec.rationale}
                          </p>
                        </div>
                      ))}
                      
                      <div className="p-3 bg-card/60 rounded-lg">
                        <p className="text-sm text-foreground mb-2">
                          <TrendingUp className="inline w-4 h-4 mr-1" />
                          <strong>Activity Goal:</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(stats as any)?.weeklyProgress?.activitiesThisWeek >= 5 
                            ? `Amazing progress! You're on track with ${(stats as any)?.weeklyProgress?.activitiesThisWeek} activities this week.`
                            : `Complete ${5 - ((stats as any)?.weeklyProgress?.activitiesThisWeek || 0)} more career activities to maintain momentum.`
                          }
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Fallback for when no resume analysis is available */}
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
                            : `Upload your resume to get personalized recommendations and improve your match score.`
                          }
                        </p>
                        {(stats as any)?.rmsScore === 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate('/resume')}
                            data-testid="button-run-analysis"
                          >
                            Upload Resume
                          </Button>
                        )}
                      </div>
                      
                      <div className="p-3 bg-card/60 rounded-lg">
                        <p className="text-sm text-foreground mb-2">
                          <TrendingUp className="inline w-4 h-4 mr-1" />
                          <strong>Activity Goal:</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(stats as any)?.weeklyProgress?.activitiesThisWeek >= 5 
                            ? `Amazing progress! You're on track with ${(stats as any)?.weeklyProgress?.activitiesThisWeek} activities this week.`
                            : `Complete ${5 - ((stats as any)?.weeklyProgress?.activitiesThisWeek || 0)} more career activities to maintain momentum.`
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  className="w-full mt-4" 
                  variant="secondary" 
                  data-testid="button-more-insights"
                  onClick={() => navigate('/resume')}
                >
                  Get More Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

