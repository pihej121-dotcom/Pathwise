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
  MessageSquare, 
  Target, 
  Download,
  Users,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/Layout';

export function AICopilot() {
  const [activeTab, setActiveTab] = useState('resumes');
  const [coverLetterForm, setCoverLetterForm] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
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
            <TabsTrigger value="resumes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tailored Resumes
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Cover Letters
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Salary Negotiator
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              LinkedIn Optimizer
            </TabsTrigger>
          </TabsList>


          {/* Tailored Resumes Tab */}
          <TabsContent value="resumes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">AI-Tailored Resumes</h2>
              <p className="text-sm text-muted-foreground">
                Tailored resumes are created from Job Matching when you click "Tailor Resume"
              </p>
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


          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter" className="space-y-6">
            <h2 className="text-2xl font-bold">AI Cover Letter Generator</h2>
            
            <div className="max-w-2xl mx-auto">
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
            </div>
          </TabsContent>

          {/* Salary Negotiator Tab */}
          <TabsContent value="salary" className="space-y-6">
            <h2 className="text-2xl font-bold">AI Salary Negotiator</h2>
            
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Salary Negotiation Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Get AI-powered negotiation strategies and market insights for salary discussions.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentSalary">Current Salary (Optional)</Label>
                      <Input
                        id="currentSalary"
                        placeholder="e.g., $75,000"
                        data-testid="input-current-salary"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="targetSalary">Target Salary</Label>
                      <Input
                        id="targetSalary"
                        placeholder="e.g., $95,000"
                        data-testid="input-target-salary"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="jobRole">Job Role</Label>
                      <Input
                        id="jobRole"
                        placeholder="e.g., Senior Software Engineer"
                        data-testid="input-job-role"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., San Francisco, CA"
                        data-testid="input-location"
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      disabled={!activeResume}
                      data-testid="button-generate-salary-strategy"
                    >
                      Generate Negotiation Strategy
                    </Button>
                    
                    {!activeResume && (
                      <p className="text-sm text-orange-600">
                        Please upload a resume first to get personalized salary negotiation advice.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LinkedIn Optimizer Tab */}
          <TabsContent value="linkedin" className="space-y-6">
            <h2 className="text-2xl font-bold">LinkedIn Profile Optimizer</h2>
            
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    LinkedIn Profile Enhancement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Optimize your LinkedIn profile for better visibility and professional opportunities.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentHeadline">Current LinkedIn Headline</Label>
                      <Input
                        id="currentHeadline"
                        placeholder="e.g., Software Engineer at Company"
                        data-testid="input-current-headline"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="currentAbout">Current About Section</Label>
                      <Textarea
                        id="currentAbout"
                        placeholder="Paste your current About section here..."
                        rows={4}
                        data-testid="textarea-current-about"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="targetIndustries">Target Industries</Label>
                      <Input
                        id="targetIndustries"
                        placeholder="e.g., Technology, Fintech, Healthcare"
                        data-testid="input-target-industries"
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      disabled={!activeResume}
                      data-testid="button-optimize-linkedin"
                    >
                      Optimize LinkedIn Profile
                    </Button>
                    
                    {!activeResume && (
                      <p className="text-sm text-orange-600">
                        Please upload a resume first to get personalized LinkedIn optimization.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}