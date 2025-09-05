import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Route, 
  CheckCircle, 
  Play, 
  Clock, 
  Target,
  Calendar,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  FileText,
  Search,
  MessageSquare,
  GraduationCap
} from "lucide-react";
import { format, addDays, addMonths } from "date-fns";

export default function CareerRoadmap() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activePhase, setActivePhase] = useState<"30_days" | "3_months" | "6_months">("30_days");
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: ["/api/roadmaps"],
  });

  const generateRoadmapMutation = useMutation({
    mutationFn: async (phase: string) => {
      const res = await apiRequest("POST", "/api/roadmaps/generate", { phase });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmaps"] });
      toast({
        title: "Roadmap generated successfully",
        description: "Your personalized career roadmap is ready!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate roadmap",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const res = await apiRequest("PUT", `/api/roadmaps/${id}/progress`, { progress });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmaps"] });
    },
  });

  const handleGenerateRoadmap = (phase: string) => {
    generateRoadmapMutation.mutate(phase);
  };

  const toggleSubsection = (subsectionId: string) => {
    const newExpanded = new Set(expandedSubsections);
    if (newExpanded.has(subsectionId)) {
      newExpanded.delete(subsectionId);
    } else {
      newExpanded.add(subsectionId);
    }
    setExpandedSubsections(newExpanded);
  };

  const toggleTaskCompleteMutation = useMutation({
    mutationFn: async ({ roadmapId, taskId, completed }: { roadmapId: string; taskId: string; completed: boolean }) => {
      const method = completed ? "POST" : "DELETE";
      const res = await apiRequest(method, `/api/roadmaps/${roadmapId}/tasks/${taskId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roadmaps"] });
      toast({
        title: "Task updated!",
        description: "Task completion status saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleTaskComplete = (roadmapId: string, taskId: string) => {
    const isCurrentlyCompleted = completedTasks.has(taskId);
    const newCompleted = new Set(completedTasks);
    
    // Optimistic update
    if (isCurrentlyCompleted) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);

    // Persist to backend
    toggleTaskCompleteMutation.mutate({
      roadmapId,
      taskId,
      completed: !isCurrentlyCompleted
    });
  };

  const getSubsectionIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('skill') || titleLower.includes('technical')) return BookOpen;
    if (titleLower.includes('network') || titleLower.includes('professional')) return Users;
    if (titleLower.includes('resume') || titleLower.includes('portfolio')) return FileText;
    if (titleLower.includes('search') || titleLower.includes('job')) return Search;
    if (titleLower.includes('interview') || titleLower.includes('practice')) return MessageSquare;
    if (titleLower.includes('industry') || titleLower.includes('knowledge')) return GraduationCap;
    return Target;
  };

  const getSubsectionProgress = (subsection: any) => {
    if (!subsection.tasks) return 0;
    const completedCount = subsection.tasks.filter((task: any) => 
      completedTasks.has(task.id)
    ).length;
    return Math.round((completedCount / subsection.tasks.length) * 100);
  };

  const handleActionComplete = (roadmapId: string, actionId: string) => {
    // Legacy action completion - kept for compatibility
    toast({
      title: "Action completed!",
      description: "Great job on completing this milestone.",
    });
  };

  const getPhaseTitle = (phase: string) => {
    switch (phase) {
      case "30_days": return "30-Day Sprint";
      case "3_months": return "3-Month Foundation";
      case "6_months": return "6-Month Transformation";
      default: return phase;
    }
  };

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case "30_days": return "Quick wins and immediate improvements";
      case "3_months": return "Building solid foundations for your career";
      case "6_months": return "Long-term transformation and growth";
      default: return "";
    }
  };

  const getTargetDate = (phase: string) => {
    const now = new Date();
    switch (phase) {
      case "30_days": return addDays(now, 30);
      case "3_months": return addMonths(now, 3);
      case "6_months": return addMonths(now, 6);
      default: return now;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-white" />;
      case "in_progress": return <Play className="w-5 h-5 text-white" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-primary animate-pulse";
      default: return "bg-muted border-2 border-dashed border-muted-foreground";
    }
  };

  const currentRoadmap = (roadmaps as any[])?.find((r: any) => r.phase === activePhase);

  if (isLoading) {
    return (
      <Layout title="Career Roadmap" subtitle="Your personalized path to career success">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Career Roadmap" subtitle="Your personalized path to career success">
      <div className="space-y-6">
        {/* Phase Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["30_days", "3_months", "6_months"].map((phase) => {
            const roadmap = (roadmaps as any[])?.find((r: any) => r.phase === phase);
            const isActive = phase === activePhase;
            
            return (
              <Card 
                key={phase}
                className={`cursor-pointer transition-all ${
                  isActive ? "border-primary bg-primary/5" : "hover:shadow-md"
                }`}
                onClick={() => setActivePhase(phase as any)}
                data-testid={`phase-${phase}`}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      {getPhaseTitle(phase)}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {getPhaseDescription(phase)}
                    </p>
                    
                    {roadmap ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-2xl font-bold">{roadmap.progress || 0}%</span>
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <Progress value={roadmap.progress || 0} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Target: {format(getTargetDate(phase), "MMM dd, yyyy")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateRoadmap(phase);
                          }}
                          disabled={generateRoadmapMutation.isPending}
                        >
                          {generateRoadmapMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Lightbulb className="w-4 h-4 mr-2" />
                          )}
                          Generate Plan
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Phase Details */}
        {currentRoadmap ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Route className="w-5 h-5" />
                    <span>{currentRoadmap.title}</span>
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {currentRoadmap.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <Progress value={currentRoadmap.progress || 0} className="w-20 h-2" />
                    <span className="text-sm font-medium text-primary">
                      {currentRoadmap.progress || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: {format(getTargetDate(activePhase), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* New Subsection-Based UI */}
              {currentRoadmap.subsections && currentRoadmap.subsections.length > 0 ? (
                <div className="space-y-4">
                  {currentRoadmap.subsections.map((subsection: any, index: number) => {
                    const SubsectionIcon = getSubsectionIcon(subsection.title);
                    const isExpanded = expandedSubsections.has(`${currentRoadmap.id}-${index}`);
                    const progress = getSubsectionProgress(subsection);
                    
                    return (
                      <Collapsible
                        key={index}
                        open={isExpanded}
                        onOpenChange={() => toggleSubsection(`${currentRoadmap.id}-${index}`)}
                      >
                        <Card className="border-l-4 border-l-primary">
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <SubsectionIcon className="w-5 h-5 text-primary" />
                                  <div>
                                    <h4 className="font-semibold text-left">{subsection.title}</h4>
                                    <p className="text-sm text-muted-foreground text-left">
                                      {subsection.description}
                                    </p>
                                    {subsection.estimatedHours && (
                                      <p className="text-xs text-primary text-left">
                                        {subsection.estimatedHours}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                      <Progress value={progress} className="w-16 h-2" />
                                      <span className="text-sm font-medium">{progress}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {subsection.tasks ? `${subsection.tasks.filter((t: any) => completedTasks.has(t.id)).length}/${subsection.tasks.length} tasks` : '0 tasks'}
                                    </p>
                                  </div>
                                  
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              {subsection.tasks && subsection.tasks.length > 0 ? (
                                <div className="space-y-3">
                                  {subsection.tasks.map((task: any, taskIndex: number) => {
                                    const isCompleted = completedTasks.has(task.id);
                                    
                                    return (
                                      <div
                                        key={task.id}
                                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                          isCompleted 
                                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                            : 'bg-muted/30 hover:bg-muted/50'
                                        }`}
                                        data-testid={`task-${subsection.title.replace(/\s+/g, '-').toLowerCase()}-${taskIndex}`}
                                      >
                                        <Checkbox
                                          checked={isCompleted}
                                          onCheckedChange={() => toggleTaskComplete(currentRoadmap.id, task.id)}
                                          className="mt-1"
                                          data-testid={`checkbox-task-${taskIndex}`}
                                        />
                                        
                                        <div className="flex-1 min-w-0">
                                          <h5 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.title}
                                          </h5>
                                          <p className={`text-sm mt-1 ${isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                            {task.description}
                                          </p>
                                          
                                          <div className="flex items-center space-x-4 mt-2">
                                            {task.dueDate && (
                                              <span className="text-xs text-muted-foreground flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {format(new Date(task.dueDate), "MMM dd")}
                                              </span>
                                            )}
                                            
                                            {task.priority && (
                                              <Badge 
                                                variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                                                className="text-xs"
                                              >
                                                {task.priority}
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {task.resources && task.resources.length > 0 && (
                                            <div className="mt-2">
                                              <p className="text-xs text-muted-foreground mb-1">Resources:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {task.resources.map((resource: string, resIndex: number) => (
                                                  <Badge key={resIndex} variant="outline" className="text-xs">
                                                    {resource}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-center py-4">
                                  No tasks defined for this subsection
                                </p>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                /* Fallback to legacy actions display */
                <div className="space-y-4">
                  {currentRoadmap.actions?.map((action: any, index: number) => (
                    <div 
                      key={action.id}
                      className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`action-${index}`}
                    >
                      <div className={`w-10 h-10 ${getStatusColor(action.completed ? "completed" : "pending")} rounded-full flex items-center justify-center`}>
                        {getStatusIcon(action.completed ? "completed" : "pending")}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {action.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Why this matters:</strong> {action.rationale}
                        </p>
                      </div>
                      
                      <div className="text-right space-y-2">
                        {action.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="inline w-3 h-3 mr-1" />
                            {format(new Date(action.dueDate), "MMM dd")}
                          </p>
                        )}
                        
                        <div>
                          {action.completed ? (
                            <Badge variant="default" className="bg-green-500 text-white">
                              Completed
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleActionComplete(currentRoadmap.id, action.id)}
                              data-testid={`complete-action-${index}`}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Keep up the great work! Each completed action brings you closer to your career goals.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleGenerateRoadmap(activePhase)}
                    variant="outline"
                    disabled={generateRoadmapMutation.isPending}
                    data-testid="regenerate-roadmap"
                  >
                    {generateRoadmapMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Route className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  No roadmap for {getPhaseTitle(activePhase)}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Generate a personalized {getPhaseTitle(activePhase).toLowerCase()} plan to get started
                </p>
                <Button
                  onClick={() => handleGenerateRoadmap(activePhase)}
                  disabled={generateRoadmapMutation.isPending}
                  data-testid="generate-roadmap-empty"
                >
                  {generateRoadmapMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4 mr-2" />
                  )}
                  Generate {getPhaseTitle(activePhase)} Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips and Insights */}
        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>Roadmap Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Stay Consistent</h4>
                <p className="text-sm text-muted-foreground">
                  Small daily actions compound into significant career progress over time.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Track Progress</h4>
                <p className="text-sm text-muted-foreground">
                  Mark actions as complete to maintain momentum and visualize your growth.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Adapt as Needed</h4>
                <p className="text-sm text-muted-foreground">
                  Regenerate your roadmap if your career goals or situation changes.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Focus on Impact</h4>
                <p className="text-sm text-muted-foreground">
                  Prioritize high-impact actions that align with your target role.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
