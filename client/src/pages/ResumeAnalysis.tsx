import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressRing } from "@/components/ProgressRing";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Book,
  Award,
  Briefcase,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Hash
} from "lucide-react";
import { format } from "date-fns";
import { ResumeHistoryChart } from "@/components/ResumeHistoryChart";

export default function ResumeAnalysis() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [targetCompanies, setTargetCompanies] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Check if user has free tier
  const isFreeUser = user?.subscriptionTier === "free";

  // Handle upgrade to Pro
  const handleUpgrade = async () => {
    try {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", {});
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    }
  };

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ["/api/resumes"],
  });

  const { data: activeResume = null } = useQuery({
    queryKey: ["/api/resumes/active"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ resumeText, targetRole, targetIndustry, targetCompanies }: { resumeText: string; targetRole: string; targetIndustry?: string; targetCompanies?: string }) => {
      const res = await apiRequest("POST", "/api/resumes", { 
        fileName: "resume.txt", 
        filePath: "/text-input", 
        extractedText: resumeText,
        targetRole,
        targetIndustry,
        targetCompanies 
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes/active"] });
      toast({
        title: "Resume analyzed successfully!",
        description: "Your resume has been analyzed. Check the scores and recommendations below.",
      });
      setIsAnalyzing(false);
      setResumeText("");
      setTargetRole("");
      setTargetIndustry("");
      setTargetCompanies("");
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeText.trim()) {
      toast({
        title: "Resume text required",
        description: "Please paste your resume content.",
        variant: "destructive",
      });
      return;
    }
    
    if (!targetRole.trim()) {
      toast({
        title: "Target role required",
        description: "Please enter your target role.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    analyzeMutation.mutate({
      resumeText: resumeText.trim(),
      targetRole: targetRole.trim(),
      targetIndustry: targetIndustry.trim(),
      targetCompanies: targetCompanies.trim()
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <Layout title="Resume Analysis" subtitle="AI-powered resume insights and recommendations">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Resume Analysis" subtitle="AI-powered resume insights and recommendations">
      <div className="space-y-6">
        {/* Resume Input Section - Always Show */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Analyze Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="text-center space-y-4 py-8">
                  <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-primary"></div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Analyzing Your Resume</h3>
                    <p className="text-sm text-muted-foreground">AI is processing your resume and identifying gaps for your target role...</p>
                    <div className="w-48 mx-auto bg-muted h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-2 rounded-full w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target-role">Target Role *</Label>
                      <Input
                        id="target-role"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g., Senior Software Engineer"
                        required
                        data-testid="input-target-role"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="target-industry">Target Industry</Label>
                      <Input
                        id="target-industry"
                        value={targetIndustry}
                        onChange={(e) => setTargetIndustry(e.target.value)}
                        placeholder="e.g., Technology, Healthcare, Finance"
                        data-testid="input-target-industry"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="target-companies">Target Companies</Label>
                      <Input
                        id="target-companies"
                        value={targetCompanies}
                        onChange={(e) => setTargetCompanies(e.target.value)}
                        placeholder="e.g., Google, Microsoft, Startup"
                        data-testid="input-target-companies"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Enter your career goals for personalized gap analysis and recommendations
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resume-text">Resume Content *</Label>
                    <Textarea
                      id="resume-text"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Copy and paste your resume content here..."
                      className="min-h-[300px] font-mono text-sm"
                      required
                      data-testid="textarea-resume-content"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the full text of your resume for comprehensive analysis
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!resumeText.trim() || !targetRole.trim()}
                    data-testid="button-analyze-resume"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Analyze Resume for Target Role
                  </Button>
                </form>
              )}
          </CardContent>
        </Card>

        {/* Active Resume Analysis */}
        {activeResume && (
          <>
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Resume Analysis Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold" data-testid="overall-score">
                      {(activeResume as any)?.rmsScore || 0}/100
                    </h3>
                    <p className="text-muted-foreground">Overall Resume Match Score</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analyzed on {(activeResume as any)?.createdAt ? format(new Date((activeResume as any).createdAt), "PPP") : 'Unknown'}
                    </p>
                  </div>
                  <ProgressRing progress={(activeResume as any)?.rmsScore || 0} size={80} />
                </div>
              </CardContent>
            </Card>

            {/* Category Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedSection === 'skills' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSection(selectedSection === 'skills' ? null : 'skills')}
                data-testid="card-skills"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Skills</p>
                      <p className={`text-2xl font-bold ${getScoreColor((activeResume as any)?.skillsScore || 0)}`}>
                        {(activeResume as any)?.skillsScore || 0}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor((activeResume as any)?.skillsScore || 0)}`}>
                      <Target className="w-6 h-6" />
                    </div>
                  </div>
                  <Progress value={(activeResume as any)?.skillsScore || 0} className="h-2" />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedSection === 'experience' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSection(selectedSection === 'experience' ? null : 'experience')}
                data-testid="card-experience"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className={`text-2xl font-bold ${getScoreColor((activeResume as any)?.experienceScore || 0)}`}>
                        {(activeResume as any)?.experienceScore || 0}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor((activeResume as any)?.experienceScore || 0)}`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>
                  <Progress value={(activeResume as any)?.experienceScore || 0} className="h-2" />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedSection === 'education' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSection(selectedSection === 'education' ? null : 'education')}
                data-testid="card-education"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Education</p>
                      <p className={`text-2xl font-bold ${getScoreColor((activeResume as any)?.educationScore || 0)}`}>
                        {(activeResume as any)?.educationScore || 0}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor((activeResume as any)?.educationScore || 0)}`}>
                      <GraduationCap className="w-6 h-6" />
                    </div>
                  </div>
                  <Progress value={(activeResume as any)?.educationScore || 0} className="h-2" />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedSection === 'keywords' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSection(selectedSection === 'keywords' ? null : 'keywords')}
                data-testid="card-keywords"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Keywords</p>
                      <p className={`text-2xl font-bold ${getScoreColor((activeResume as any)?.keywordsScore || 0)}`}>
                        {(activeResume as any)?.keywordsScore || 0}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor((activeResume as any)?.keywordsScore || 0)}`}>
                      <Hash className="w-6 h-6" />
                    </div>
                  </div>
                  <Progress value={(activeResume as any)?.keywordsScore || 0} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Section Details */}
            {selectedSection && (activeResume as any)?.sectionAnalysis?.[selectedSection] && (
              <PaywallOverlay showPaywall={isFreeUser} onUpgrade={handleUpgrade}>
                <Card className="mt-6" data-testid="section-details">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      {selectedSection === 'skills' && <Target className="w-5 h-5" />}
                      {selectedSection === 'experience' && <Briefcase className="w-5 h-5" />}
                      {selectedSection === 'education' && <GraduationCap className="w-5 h-5" />}
                      {selectedSection === 'keywords' && <Hash className="w-5 h-5" />}
                      {selectedSection} Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Analysis</p>
                      <p className="text-base" data-testid="section-explanation">
                        {(activeResume as any).sectionAnalysis[selectedSection].explanation}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold">Strengths</h4>
                        </div>
                        <ul className="space-y-2" data-testid="section-strengths">
                          {(activeResume as any).sectionAnalysis[selectedSection].strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          <h4 className="font-semibold">Gaps</h4>
                        </div>
                        <ul className="space-y-2" data-testid="section-gaps">
                          {(activeResume as any).sectionAnalysis[selectedSection].gaps.map((gap: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold">How to Improve</h4>
                      </div>
                      <ul className="space-y-2" data-testid="section-improvements">
                        {(activeResume as any).sectionAnalysis[selectedSection].improvements.map((improvement: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">→</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </PaywallOverlay>
            )}

            {/* Improvement Recommendations */}
            {(activeResume as any)?.gaps && Array.isArray((activeResume as any)?.gaps) && (activeResume as any)?.gaps.length > 0 && (
              <PaywallOverlay showPaywall={isFreeUser} onUpgrade={handleUpgrade}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Improvement Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {((activeResume as any)?.gaps || []).map((gap: any, index: number) => (
                        <div 
                          key={index}
                          className="p-4 border border-border rounded-lg"
                          data-testid={`gap-${index}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={getPriorityColor(gap.priority)}>
                                  {gap.priority.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{gap.category}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {gap.rationale}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-green-600">
                                +{gap.impact} points
                              </span>
                            </div>
                          </div>

                          {gap.resources && gap.resources.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Recommended Resources:</p>
                              <div className="space-y-2">
                                {gap.resources.map((resource: any, resIndex: number) => (
                                  <div 
                                    key={resIndex}
                                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{resource.title}</p>
                                      <p className="text-xs text-muted-foreground">{resource.provider}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {resource.cost && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                          {resource.cost}
                                        </span>
                                      )}
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open(resource.url, '_blank')}
                                        data-testid={`resource-link-${index}-${resIndex}`}
                                      >
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </PaywallOverlay>
            )}

          </>
        )}

        {/* Resume History */}
        {(resumes as any[]) && (resumes as any[]).length > 0 && (
          <ResumeHistoryChart 
            resumes={resumes as any[]}
            activeResumeId={(activeResume as any)?.id}
          />
        )}
      </div>
    </Layout>
  );
}
