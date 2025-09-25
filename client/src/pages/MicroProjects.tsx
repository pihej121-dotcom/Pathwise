import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Zap, Clock, Target, CheckCircle2, PlayCircle, Code, Database, Brain } from "lucide-react";

interface SkillGapAnalysis {
  id: string;
  targetRole: string;
  skillGaps: string[];
  strengthSkills: string[];
  summary: string;
  createdAt: string;
}

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
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch skill gap analyses
  const { data: skillGaps = [], isLoading: skillGapsLoading } = useQuery<SkillGapAnalysis[]>({
    queryKey: ["/api/skill-gaps"],
  });

  // Fetch recommended projects based on skill gaps
  const { data: recommendedProjects = [], isLoading: projectsLoading } = useQuery<MicroProject[]>({
    queryKey: ["/api/micro-projects/recommended"],
  });

  // Fetch user project completions
  const { data: completions = [], isLoading: completionsLoading } = useQuery<ProjectCompletion[]>({
    queryKey: ["/api/project-completions"],
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

  const generateProjects = async (analysisId: string) => {
    try {
      const response = await fetch("/api/micro-projects/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ skillGapAnalysisId: analysisId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate projects");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/micro-projects/recommended"] });
      toast({
        title: "Projects Generated!",
        description: "New micro-projects have been generated for your skill gaps.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate projects. Please try again.",
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

  if (skillGapsLoading || projectsLoading || completionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="micro-projects-page">
      <div className="flex items-center space-x-3">
        <Zap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold" data-testid="page-title">Micro-Internship Marketplace</h1>
      </div>
      
      <p className="text-muted-foreground text-lg max-w-3xl" data-testid="page-description">
        Transform your skill gaps into hands-on experience through bite-sized projects with real datasets and portfolio-ready outcomes.
      </p>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list">
          <TabsTrigger value="projects" data-testid="tab-projects">Available Projects</TabsTrigger>
          <TabsTrigger value="skill-gaps" data-testid="tab-skill-gaps">Skill Analysis</TabsTrigger>
          <TabsTrigger value="progress" data-testid="tab-progress">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold" data-testid="projects-section-title">Recommended for You</h2>
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/micro-projects/recommended"] })}
              data-testid="button-refresh-projects"
            >
              Refresh Recommendations
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
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">You'll Build</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {project.portfolioOutcomes.slice(0, 2).map((outcome, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {completion ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{completion.progressPercentage}%</span>
                          </div>
                          <Progress value={completion.progressPercentage} data-testid={`progress-${project.id}`} />
                          <p className="text-xs text-muted-foreground">
                            Status: {completion.status.replace("_", " ")}
                          </p>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => startProject(project.id)}
                          data-testid={`button-start-${project.id}`}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Project
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12" data-testid="no-projects-message">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Projects Available</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your resume and get skill gap analysis to see personalized project recommendations.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="skill-gaps" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold" data-testid="skill-gaps-section-title">Your Skill Gap Analysis</h2>
          </div>
          
          <div className="space-y-4">
            {skillGaps.length > 0 ? (
              skillGaps.map((analysis: SkillGapAnalysis) => (
                <Card key={analysis.id} data-testid={`card-analysis-${analysis.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span data-testid={`analysis-role-${analysis.id}`}>{analysis.targetRole || "General Analysis"}</span>
                      <Button 
                        onClick={() => generateProjects(analysis.id)}
                        size="sm"
                        data-testid={`button-generate-${analysis.id}`}
                      >
                        Generate Projects
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Analysis created on {new Date(analysis.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Skills to Develop</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.skillGaps.map((skill, idx) => (
                          <Badge key={idx} variant="destructive" data-testid={`gap-skill-${analysis.id}-${idx}`}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {analysis.strengthSkills && analysis.strengthSkills.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-green-600">Your Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.strengthSkills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800" data-testid={`strength-skill-${analysis.id}-${idx}`}>
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {analysis.summary && (
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm text-muted-foreground" data-testid={`summary-${analysis.id}`}>
                          {analysis.summary}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12" data-testid="no-analyses-message">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Skill Gap Analysis Yet</h3>
                <p className="text-muted-foreground">
                  Upload your resume and apply to jobs to get AI-powered skill gap analysis.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <h2 className="text-2xl font-semibold" data-testid="progress-section-title">Your Project Progress</h2>
          
          <div className="space-y-4">
            {completions.length > 0 ? (
              completions.map((completion: ProjectCompletion) => (
                <Card key={completion.id} data-testid={`card-completion-${completion.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span data-testid={`completion-project-${completion.id}`}>Project #{completion.projectId.slice(-8)}</span>
                      <Badge 
                        variant={completion.status === "completed" ? "default" : "secondary"}
                        data-testid={`status-${completion.id}`}
                      >
                        {completion.status.replace("_", " ")}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span data-testid={`progress-percentage-${completion.id}`}>{completion.progressPercentage}%</span>
                      </div>
                      <Progress value={completion.progressPercentage} data-testid={`progress-bar-${completion.id}`} />
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span data-testid={`time-spent-${completion.id}`}>
                        Time spent: {completion.timeSpent} hours
                      </span>
                    </div>
                    
                    {completion.reflectionNotes && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Reflection Notes</h4>
                        <p className="text-sm text-muted-foreground" data-testid={`reflection-${completion.id}`}>
                          {completion.reflectionNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12" data-testid="no-progress-message">
                <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Projects Started Yet</h3>
                <p className="text-muted-foreground">
                  Start your first micro-project to track your progress here.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}