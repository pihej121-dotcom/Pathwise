import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ProgressRing } from "@/components/ProgressRing";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Book,
  Award,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { format } from "date-fns";

export default function ResumeAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ["/api/resumes"],
  });

  const { data: activeResume = null } = useQuery({
    queryKey: ["/api/resumes/active"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ fileName, filePath }: { fileName: string; filePath: string }) => {
      const res = await apiRequest("POST", "/api/resumes", { fileName, filePath });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes/active"] });
      toast({
        title: "Resume uploaded successfully",
        description: "AI analysis is in progress...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      console.log('Getting upload parameters...');
      const res = await apiRequest("POST", "/api/resumes/upload", {});
      const data = await res.json();
      console.log('Upload URL received:', data.uploadURL);
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Failed to get upload parameters:', error);
      toast({
        title: "Upload setup failed",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = (result: any) => {
    console.log('Upload complete result:', result);
    
    if (result.failed && result.failed.length > 0) {
      console.error('Upload failed:', result.failed);
      toast({
        title: "Upload failed",
        description: "Please check your file and try again.",
        variant: "destructive",
      });
      return;
    }
    
    const uploadedFile = result.successful?.[0];
    console.log('Uploaded file:', uploadedFile);
    
    if (uploadedFile) {
      // Use the upload URL for the file path
      const filePath = uploadedFile.uploadURL || uploadedFile.response?.uploadURL;
      console.log('File path:', filePath);
      
      uploadMutation.mutate({
        fileName: uploadedFile.name,
        filePath: filePath,
      });
    } else {
      console.error('No successful uploads found');
      toast({
        title: "Upload failed",
        description: "No file was successfully uploaded.",
        variant: "destructive",
      });
    }
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
        {/* Upload Section */}
        {!activeResume && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
                <p className="text-muted-foreground mb-4">
                  Get AI-powered analysis and personalized recommendations
                </p>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="mx-auto"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Resume"}
                </ObjectUploader>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports PDF, DOC, and DOCX files up to 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
              <Card>
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

              <Card>
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

              <Card>
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

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Keywords</p>
                      <p className={`text-2xl font-bold ${getScoreColor((activeResume as any)?.keywordsScore || 0)}`}>
                        {(activeResume as any)?.keywordsScore || 0}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor((activeResume as any)?.keywordsScore || 0)}`}>
                      <Book className="w-6 h-6" />
                    </div>
                  </div>
                  <Progress value={(activeResume as any)?.keywordsScore || 0} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Improvement Recommendations */}
            {(activeResume as any)?.gaps && Array.isArray((activeResume as any)?.gaps) && (activeResume as any)?.gaps.length > 0 && (
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
            )}

            {/* Upload New Resume */}
            <Card>
              <CardHeader>
                <CardTitle>Upload New Version</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Upload an updated resume to track your progress and get fresh insights
                    </p>
                  </div>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Resume
                  </ObjectUploader>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Resume History */}
        {(resumes as any[]) && (resumes as any[]).length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Resume History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(resumes as any[]).map((resume: any, index: number) => (
                  <div 
                    key={resume.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      resume.isActive ? "border-primary bg-primary/5" : "border-border"
                    }`}
                    data-testid={`resume-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{resume.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(resume.createdAt), "PPp")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {resume.rmsScore && (
                        <div className="text-right">
                          <p className="font-medium">{resume.rmsScore}/100</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      )}
                      {resume.isActive && (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
