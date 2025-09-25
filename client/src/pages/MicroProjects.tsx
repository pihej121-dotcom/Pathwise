import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Clock, Target, CheckCircle2, PlayCircle, Code, Database, Brain, Loader2, Zap } from "lucide-react";

interface MicroProject {
  id: string;
  title: string;
  description: string;
  targetSkill: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  datasets: string[];
  templates: string[];
  portfolioOutcomes: string[];
  tags: string[];
  isActive: boolean;
}

interface ProjectCompletion {
  id: string;
  projectId: string;
  userId: string;
  status: "not_started" | "in_progress" | "completed";
  progressPercentage: number;
  timeSpent: number;
  reflectionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MicroProjects() {
  const { toast } = useToast();

  // Fetch recommended projects
  const { data: recommendedProjects = [], isLoading: projectsLoading } = useQuery<MicroProject[]>({
    queryKey: ["/api/micro-projects/recommended"],
  });

  // Fetch user project completions
  const { data: completions = [], isLoading: completionsLoading } = useQuery<ProjectCompletion[]>({
    queryKey: ["/api/project-completions"],
  });

  // AI-powered project refresh mutation
  const refreshRecommendations = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/micro-projects/refresh-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh recommendations');
      }
      
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/micro-projects/recommended'] });
      toast({
        title: "AI Project Generated!",
        description: `Generated 1 new AI-powered project based on your top skill gap!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate new AI-powered projects. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/micro-projects/${projectId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to start project");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/project-completions"] });
      toast({
        title: "Project Started!",
        description: "Your micro-project has been started. Good luck!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getSkillIcon = (skill: string) => {
    const skillLower = skill.toLowerCase();
    if (skillLower.includes("javascript") || skillLower.includes("react") || skillLower.includes("frontend")) return Code;
    if (skillLower.includes("sql") || skillLower.includes("database") || skillLower.includes("data")) return Database;
    if (skillLower.includes("ai") || skillLower.includes("machine") || skillLower.includes("python")) return Brain;
    return Target;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (projectsLoading || completionsLoading) {
    return (
      <Layout title="Micro-Internship Marketplace" subtitle="Bridge your skill gaps with bite-sized projects using real datasets and industry templates">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading micro-projects...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Micro-Internship Marketplace" subtitle="Bridge your skill gaps with bite-sized projects using real datasets and industry templates">
      <div className="space-y-8" data-testid="micro-projects-page">

      {/* Available Projects Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold" data-testid="projects-section-title">Available Projects</h2>
          <Button 
            variant="outline" 
            onClick={() => refreshRecommendations.mutate()}
            disabled={refreshRecommendations.isPending}
            data-testid="button-refresh-projects"
          >
            {refreshRecommendations.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating AI Project...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate AI Project
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedProjects.length > 0 ? (
            recommendedProjects.map((project: MicroProject) => {
              const Icon = getSkillIcon(project.targetSkill);
              const completion = completions.find((c: ProjectCompletion) => c.projectId === project.id);
              
              return (
                <Card key={project.id} className="flex flex-col h-full" data-testid={`card-project-${project.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <Badge className={getDifficultyColor(project.difficulty)} data-testid={`badge-difficulty-${project.id}`}>
                          {project.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {project.estimatedHours}h
                      </div>
                    </div>
                    <CardTitle className="text-lg" data-testid={`title-project-${project.id}`}>{project.title}</CardTitle>
                    <CardDescription data-testid={`description-project-${project.id}`}>{project.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Target Skill</h4>
                      <Badge variant="secondary" data-testid={`badge-skill-${project.id}`}>{project.targetSkill}</Badge>
                    </div>
                    
                    {project.tags && project.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Skills & Topics</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-tag-${project.id}-${index}`}>
                              {tag}
                            </Badge>
                          ))}
                          {project.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {project.deliverables && project.deliverables.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Project Deliverables</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {project.deliverables.slice(0, 2).map((deliverable, index) => (
                            <li key={index} className="flex items-start" data-testid={`deliverable-${project.id}-${index}`}>
                              <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Progress Display */}
                    {completion && completion.status !== "not_started" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progress</span>
                          <Badge className={getStatusColor(completion.status)} data-testid={`badge-status-${project.id}`}>
                            {completion.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <Progress value={completion.progressPercentage} className="h-2" data-testid={`progress-${project.id}`} />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{completion.progressPercentage}% complete</span>
                          <span>{completion.timeSpent}h spent</span>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => startProject(project.id)}
                      disabled={completion?.status === "completed"}
                      className="w-full mt-auto"
                      data-testid={`button-start-${project.id}`}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {completion?.status === "completed" ? "Completed" : 
                       completion?.status === "in_progress" ? "Continue Project" : "Start Project"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12" data-testid="no-projects-message">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Projects Available</h3>
              <p className="text-muted-foreground">
                We're working on generating personalized micro-projects for you.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Summary Section */}
      {completions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold" data-testid="progress-section-title">My Progress</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-stats-total">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-projects">
                  {completions.length}
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-stats-completed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-completed-projects">
                  {completions.filter(c => c.status === "completed").length}
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-stats-hours">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="stat-total-hours">
                  {completions.reduce((sum, c) => sum + c.timeSpent, 0)}h
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}