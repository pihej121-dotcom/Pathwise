import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TourButton } from "@/components/TourButton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Briefcase, 
  CheckCircle2, 
  PlayCircle, 
  Loader2, 
  Sparkles,
  ExternalLink,
  Award,
  Target,
  Clock
} from "lucide-react";

// Updated interface matching new schema
interface MicroProject {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  targetSkill?: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  deliverables: Deliverable[];
  skillsGained: string[];
  relevanceToRole: string;
  projectType: string;
  tags?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Deliverable {
  stepNumber: number;
  instruction: string;
  resourceLinks: ResourceLink[];
}

interface ResourceLink {
  title: string;
  url: string;
  type: string;
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

export default function MicroProjects({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const [targetRole, setTargetRole] = useState("Data Scientist");
  const [projectCount, setProjectCount] = useState(2);

  // Fetch all projects (role-based generation will add to this list)
  const { data: allProjects = [], isLoading: projectsLoading } = useQuery<MicroProject[]>({
    queryKey: ["/api/micro-projects"],
  });

  // Fetch user project completions
  const { data: completions = [], isLoading: completionsLoading } = useQuery<ProjectCompletion[]>({
    queryKey: ["/api/project-completions"],
  });

  // Role-based project generation mutation
  const generateProjects = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/micro-projects/generate-from-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, count: projectCount }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate projects');
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/micro-projects'] });
      toast({
        title: "Projects Generated!",
        description: `Generated ${data.projects.length} project(s) for ${targetRole}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate projects. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/micro-projects/${projectId}/start`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) throw new Error('Failed to start project');
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getProjectStatus = (projectId: string) => {
    const completion = completions.find(c => c.projectId === projectId);
    return completion?.status || "not_started";
  };

  const loadingContent = (
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Loading micro-projects...</p>
    </div>
  );

  if (projectsLoading || completionsLoading) {
    return embedded ? loadingContent : (
      <Layout title="Micro-Projects" subtitle="Build portfolio-ready projects for your target role">
        {loadingContent}
      </Layout>
    );
  }

  const content = (
    <>
      <div className="flex justify-end mb-4">
        <TourButton tourId="micro-projects" />
      </div>
      <div className="space-y-8" data-testid="micro-projects-page">

        {/* Project Generation Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Generate Projects for Your Target Role
            </CardTitle>
            <CardDescription>
              Get AI-generated micro-projects with actionable steps, real resources, and portfolio deliverables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label htmlFor="targetRole" className="text-sm font-medium">Target Role</label>
                <Input
                  id="targetRole"
                  placeholder="e.g., Data Scientist, Product Manager, Software Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  data-testid="input-target-role"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="projectCount" className="text-sm font-medium">Number of Projects</label>
                <Input
                  id="projectCount"
                  type="number"
                  min="1"
                  max="3"
                  value={projectCount}
                  onChange={(e) => setProjectCount(parseInt(e.target.value) || 2)}
                  data-testid="input-project-count"
                />
              </div>
            </div>
            <Button 
              onClick={() => generateProjects.mutate()}
              disabled={generateProjects.isPending || !targetRole.trim()}
              className="w-full md:w-auto"
              data-testid="button-generate-projects"
            >
              {generateProjects.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Projects...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Projects
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Available Projects Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold" data-testid="projects-section-title">
            Available Projects ({allProjects.length})
          </h2>
          
          {allProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate your first micro-project by entering your target role above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {allProjects.map((project) => {
                const status = getProjectStatus(project.id);
                const isStarted = status !== "not_started";
                
                return (
                  <Card key={project.id} className="overflow-hidden" data-testid={`project-card-${project.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                          <CardDescription className="text-base">{project.description}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={getDifficultyColor(project.difficultyLevel)}>
                            {project.difficultyLevel}
                          </Badge>
                          {isStarted && (
                            <Badge className={getStatusColor(status)}>
                              {status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Target Role & Time */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>Target Role: <strong>{project.targetRole}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>~{project.estimatedHours} hours</span>
                        </div>
                      </div>

                      {/* Skills Gained */}
                      {project.skillsGained && project.skillsGained.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Award className="w-4 h-4" />
                            Skills Gained
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {project.skillsGained.map((skill, idx) => (
                              <Badge key={idx} variant="secondary" data-testid={`skill-badge-${idx}`}>
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deliverables */}
                      {project.deliverables && Array.isArray(project.deliverables) && project.deliverables.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Deliverables & Steps:</h4>
                          <div className="space-y-4">
                            {project.deliverables.map((deliverable, idx) => (
                              <div key={idx} className="pl-4 border-l-2 border-blue-200 dark:border-blue-800 space-y-2">
                                <div className="flex gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-semibold">
                                    {deliverable.stepNumber || idx + 1}
                                  </span>
                                  <p className="text-sm flex-1">{deliverable.instruction}</p>
                                </div>
                                {deliverable.resourceLinks && deliverable.resourceLinks.length > 0 && (
                                  <div className="ml-9 flex flex-wrap gap-2">
                                    {deliverable.resourceLinks.map((resource, resIdx) => (
                                      <a
                                        key={resIdx}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        data-testid={`resource-link-${idx}-${resIdx}`}
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        {resource.title}
                                        <Badge variant="outline" className="text-xs py-0">
                                          {resource.type}
                                        </Badge>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Relevance to Role */}
                      {project.relevanceToRole && (
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Why This Matters
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {project.relevanceToRole}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-4 border-t">
                        {!isStarted ? (
                          <Button
                            onClick={() => startProject(project.id)}
                            data-testid={`button-start-${project.id}`}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Project
                          </Button>
                        ) : status === "completed" ? (
                          <Button variant="outline" disabled>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        ) : (
                          <Button variant="outline" data-testid={`button-continue-${project.id}`}>
                            Continue Project
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return embedded ? content : (
    <Layout title="Micro-Projects" subtitle="Build portfolio-ready projects for your target role">
      {content}
    </Layout>
  );
}
