import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Brain, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Target, 
  Download,
  Plus,
  History,
  Wand2,
  BookOpen,
  Users,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/Layout';

export function AICopilot() {
  const [activeTab, setActiveTab] = useState('overview');
  const [coverLetterForm, setCoverLetterForm] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
  });
  const [careerInsightsForm, setCareerInsightsForm] = useState({
    targetRole: '',
    experience: '',
  });
  const { toast } = useToast();

  // Fetch tailored resumes
  const { data: tailoredResumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ['/api/copilot/tailored-resumes'],
  });

  // Fetch active resume for AI features
  const { data: activeResume } = useQuery({
    queryKey: ['/api/resumes/active'],
  });

  // Cover letter generation mutation
  const coverLetterMutation = useMutation({
    mutationFn: async (formData: typeof coverLetterForm) => {
      if (!activeResume?.extractedText) {
        throw new Error("Please upload a resume first");
      }
      
      return apiRequest('/api/copilot/cover-letter', {
        method: 'POST',
        body: {
          ...formData,
          resumeText: activeResume.extractedText
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Cover Letter Generated!",
        description: "Your personalized cover letter is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate cover letter",
        variant: "destructive",
      });
    }
  });

  // Career insights mutation
  const careerInsightsMutation = useMutation({
    mutationFn: async (formData: typeof careerInsightsForm) => {
      if (!activeResume?.extractedText) {
        throw new Error("Please upload a resume first");
      }
      
      return apiRequest('/api/copilot/career-insights', {
        method: 'POST',
        body: {
          ...formData,
          resumeText: activeResume.extractedText
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Career Insights Generated!",
        description: "Your personalized career guidance is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate career insights",
        variant: "destructive",
      });
    }
  });

  const handleGenerateCoverLetter = () => {
    if (!coverLetterForm.jobTitle || !coverLetterForm.company || !coverLetterForm.jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    coverLetterMutation.mutate(coverLetterForm);
  };

  const handleGenerateCareerInsights = () => {
    careerInsightsMutation.mutate(careerInsightsForm);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              AI Career Copilot
            </h1>
            <p className="text-muted-foreground mt-2">
              Your AI-powered career development assistant. Get personalized resumes, cover letters, and career guidance.
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Powered by GPT-5
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="resumes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tailored Resumes
            </TabsTrigger>
            <TabsTrigger value="coaching" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Career Coaching
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('resumes')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Tailored Resume
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('tools')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Cover Letter
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab('coaching')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Interview Prep
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-green-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span>Resume tailored for "Software Engineer"</span>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span>Cover letter generated</span>
                      <span className="text-xs text-muted-foreground">1d ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span>Interview prep session</span>
                      <span className="text-xs text-muted-foreground">3d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    AI Career Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
                      <p className="font-medium">Skill Recommendation</p>
                      <p className="text-muted-foreground">Consider adding "TypeScript" to strengthen your frontend profile.</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-green-500">
                      <p className="font-medium">Resume Optimization</p>
                      <p className="text-muted-foreground">Your resume is 85% optimized for tech roles.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Highlights */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Smart Resume Tailoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    AI analyzes job descriptions and automatically optimizes your resume for each application, 
                    highlighting relevant experience and skills.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                      Keyword optimization for ATS systems
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                      Experience reordering and emphasis
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                      Skills matching and highlighting
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI Career Coaching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Get personalized career advice, interview preparation, and skill development recommendations 
                    based on your goals and market trends.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-blue-500"></Badge>
                      Mock interview practice
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-blue-500"></Badge>
                      Skill gap analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-blue-500"></Badge>
                      Career path recommendations
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tailored Resumes Tab */}
          <TabsContent value="resumes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">AI-Tailored Resumes</h2>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Resume
              </Button>
            </div>

            <div className="grid gap-4">
              {/* Resume Library */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Resume Library</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    AI-optimized versions of your resume for different job types and companies.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resumesLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading your tailored resumes...</p>
                      </div>
                    ) : tailoredResumes.length > 0 ? (
                      tailoredResumes.map((resume: any) => (
                        <div key={resume.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                              <h4 className="font-medium">{resume.jobTitle} - {resume.company}</h4>
                              <p className="text-sm text-muted-foreground">
                                Tailored for: {resume.jobTitle} position
                              </p>
                              <div className="flex gap-2 mt-2">
                                {resume.jobSpecificScore && (
                                  <Badge variant="secondary" className="text-xs">
                                    {resume.jobSpecificScore}% ATS Match
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  Created {new Date(resume.createdAt).toLocaleDateString()}
                                </Badge>
                                {resume.keywordsCovered?.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {resume.keywordsCovered.length} keywords
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`download-resume-${resume.id}`}>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                            <Button size="sm" data-testid={`edit-resume-${resume.id}`}>Edit</Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No tailored resumes yet.</p>
                        <p className="text-sm">Create your first AI-optimized resume by going to Job Matching!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Career Coaching Tab */}
          <TabsContent value="coaching" className="space-y-6">
            <h2 className="text-2xl font-bold">AI Career Coaching</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Interview Preparation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Practice interviews with AI feedback and get personalized tips for your target roles.
                  </p>
                  <Button className="w-full">Start Mock Interview</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Career Insights & Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Get personalized recommendations for skills and career development.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="targetRole">Target Role (Optional)</Label>
                      <Input
                        id="targetRole"
                        placeholder="e.g., Senior Product Manager"
                        value={careerInsightsForm.targetRole}
                        onChange={(e) => setCareerInsightsForm(prev => ({ ...prev, targetRole: e.target.value }))}
                        data-testid="input-career-target-role"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="experience">Experience Level (Optional)</Label>
                      <Input
                        id="experience"
                        placeholder="e.g., 3 years, Mid-level, Senior"
                        value={careerInsightsForm.experience}
                        onChange={(e) => setCareerInsightsForm(prev => ({ ...prev, experience: e.target.value }))}
                        data-testid="input-career-experience"
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateCareerInsights}
                      disabled={careerInsightsMutation.isPending || !activeResume}
                      data-testid="button-generate-career-insights"
                    >
                      {careerInsightsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Get Career Insights'
                      )}
                    </Button>
                    
                    {!activeResume && (
                      <p className="text-sm text-orange-600">
                        Please upload a resume first to get career insights.
                      </p>
                    )}
                    
                    {careerInsightsMutation.data && (
                      <div className="mt-4 space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <h4 className="font-medium mb-2 text-green-800 dark:text-green-400">Your Strengths:</h4>
                          <ul className="text-sm space-y-1">
                            {careerInsightsMutation.data.strengths?.map((strength: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-600 dark:text-green-400">•</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-400">Skills to Develop:</h4>
                          <ul className="text-sm space-y-1">
                            {careerInsightsMutation.data.skillGaps?.map((gap: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-orange-600 dark:text-orange-400">•</span>
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-400">Next Steps:</h4>
                          <ul className="text-sm space-y-1">
                            {careerInsightsMutation.data.nextSteps?.map((step: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-600 dark:text-blue-400">•</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <h2 className="text-2xl font-bold">AI-Powered Tools</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Cover Letter Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Create compelling cover letters tailored to specific job postings.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        placeholder="e.g., Senior Software Engineer"
                        value={coverLetterForm.jobTitle}
                        onChange={(e) => setCoverLetterForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                        data-testid="input-cover-letter-job-title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="e.g., Google"
                        value={coverLetterForm.company}
                        onChange={(e) => setCoverLetterForm(prev => ({ ...prev, company: e.target.value }))}
                        data-testid="input-cover-letter-company"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="jobDescription">Job Description</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the job description here..."
                        value={coverLetterForm.jobDescription}
                        onChange={(e) => setCoverLetterForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                        rows={4}
                        data-testid="textarea-cover-letter-job-description"
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateCoverLetter}
                      disabled={coverLetterMutation.isPending || !activeResume}
                      data-testid="button-generate-cover-letter"
                    >
                      {coverLetterMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Cover Letter'
                      )}
                    </Button>
                    
                    {!activeResume && (
                      <p className="text-sm text-orange-600">
                        Please upload a resume first to generate cover letters.
                      </p>
                    )}
                    
                    {coverLetterMutation.data && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Generated Cover Letter:</h4>
                        <div className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                          {coverLetterMutation.data.coverLetter}
                        </div>
                        <Button size="sm" className="mt-2" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    LinkedIn Optimizer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Optimize your LinkedIn profile for better visibility and opportunities.
                  </p>
                  <Button className="w-full" variant="outline">Optimize Profile</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Salary Negotiator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Get AI-powered negotiation strategies and market data for salary discussions.
                  </p>
                  <Button className="w-full" variant="outline">Start Prep</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}