import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ProgressRing";
import { 
  TrendingUp, 
  Send, 
  Route, 
  Trophy, 
  CheckCircle, 
  Play, 
  Clock, 
  Target,
  Wand2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: jobMatches = { topJobMatches: [] } } = useQuery({
    queryKey: ["/api/jobs/matches"],
  });

  const { data: activities = { recentActivities: [] } } = useQuery({
    queryKey: ["/api/activities"],
  });

  if (isLoading) {
    return (
      <Layout title={`Welcome back, ${user?.firstName}!`} subtitle="Let's continue building your career path">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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

  const roadmapItems = [
    {
      id: "1",
      title: "Update LinkedIn profile with optimized keywords",
      description: "Increase visibility to recruiters in your target industry",
      status: "completed",
      completedDate: "2 days ago",
      icon: <CheckCircle className="w-5 h-5 text-white" />,
      bgColor: "bg-green-500"
    },
    {
      id: "2", 
      title: "Complete Google Analytics certification",
      description: "Bridge the digital marketing skills gap identified in your analysis",
      status: "in_progress",
      dueDate: "Due in 5 days",
      icon: <Play className="w-5 h-5 text-white" />,
      bgColor: "bg-primary animate-pulse"
    },
    {
      id: "3",
      title: "Apply to 5 target companies",
      description: "Focus on mid-size tech companies with strong growth potential", 
      status: "pending",
      startDate: "Starts in 3 days",
      icon: <Clock className="w-5 h-5 text-muted-foreground" />,
      bgColor: "bg-muted border-2 border-dashed border-muted-foreground"
    }
  ];

  return (
    <Layout 
      title={`Welcome back, ${user?.firstName}!`} 
      subtitle="Let's continue building your career path"
    >
      <div className="space-y-6">
        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Achievements Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="achievements-count">
                    {(stats as any)?.achievementsCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <span className="text-yellow-600 font-medium">
                  {(stats as any)?.weeklyProgress?.activitiesThisWeek || 0}
                </span>
                <span className="text-muted-foreground">activities this week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Career Roadmap Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Phase */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Current Phase: {(stats as any)?.currentPhase?.title || '30-Day Sprint'}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <Progress value={(stats as any)?.currentPhase?.progress || 0} className="w-20 h-2" />
                    <span className="text-sm font-medium text-primary">
                      {(stats as any)?.currentPhase?.progress || 0}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roadmapItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`roadmap-item-${item.id}`}
                    >
                      <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={item.status === "completed" ? "default" : 
                                  item.status === "in_progress" ? "secondary" : "outline"}
                          className={
                            item.status === "completed" ? "bg-green-500 text-white" :
                            item.status === "in_progress" ? "bg-primary text-primary-foreground" :
                            "text-muted-foreground"
                          }
                        >
                          {item.status === "completed" ? "Completed" :
                           item.status === "in_progress" ? "In Progress" :
                           "Pending"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.completedDate || item.dueDate || item.startDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4" data-testid="button-view-roadmap">
                  View Full Roadmap
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* AI Insights Card */}
            <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-robot text-white text-sm"></i>
                  </div>
                  <span>AI Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-card/60 rounded-lg">
                    <p className="text-sm text-foreground mb-2">
                      <Target className="inline w-4 h-4 mr-1" />
                      <strong>Resume Score:</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(stats as any)?.rmsScore >= 70 
                        ? `Excellent score! Consider applying to ${(stats as any)?.applicationStats?.pending + 2 || 3} more positions this week.`
                        : (stats as any)?.rmsScore >= 50 
                        ? `Good progress! Adding technical skills could boost your score by 15-20%.` 
                        : `Upload your resume to get personalized recommendations and improve your match score.`
                      }
                    </p>
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
                </div>

                <Button className="w-full mt-4" variant="secondary" data-testid="button-more-insights">
                  Get More Insights
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(activities as any)?.length > 0 ? (activities as any)?.map((activity: any, index: number) => (
                    <div 
                      key={activity.id}
                      className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                      data-testid={`activity-${index}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === "resume_analyzed" ? "bg-green-500/10 border-2 border-green-500/20" :
                        activity.type === "application_submitted" ? "bg-blue-500/10 border-2 border-blue-500/20" :
                        activity.type === "resume_tailored" ? "bg-purple-500/10 border-2 border-purple-500/20" :
                        activity.type === "achievement_unlocked" ? "bg-accent/10 border-2 border-accent/20" :
                        "bg-muted border-2 border-muted-foreground/20"
                      }`}>
                        {activity.type === "resume_analyzed" && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {activity.type === "application_submitted" && <Send className="w-5 h-5 text-blue-500" />}
                        {activity.type === "resume_tailored" && <Wand2 className="w-5 h-5 text-purple-500" />}
                        {activity.type === "achievement_unlocked" && <Trophy className="w-5 h-5 text-accent" />}
                        {!['resume_analyzed', 'application_submitted', 'resume_tailored', 'achievement_unlocked'].includes(activity.type) && 
                          <Clock className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.description || 'Career development activity'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {activity.type === "application_submitted" && (
                        <Badge variant="outline" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No recent activity yet!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Start by uploading your resume or applying to jobs to see your activity here.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
}
