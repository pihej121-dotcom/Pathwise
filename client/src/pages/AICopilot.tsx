import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TourButton } from '@/components/TourButton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Brain, 
  FileText, 
  MessageSquare, 
  Target, 
  Download,
  Users,
  Loader2,
  Eye
} from 'lucide-react';
import { Layout } from '@/components/Layout';

export function AICopilot({ embedded = false }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState('resumes');
  const [viewResumeModal, setViewResumeModal] = useState(false);
  const [selectedResumeContent, setSelectedResumeContent] = useState('');
  const [selectedResumeTitle, setSelectedResumeTitle] = useState('');
  const [coverLetterForm, setCoverLetterForm] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
  });
  const [salaryForm, setSalaryForm] = useState({
    currentSalary: '',
    targetSalary: '',
    jobRole: '',
    location: '',
    yearsExperience: ''
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
  const coverLetterMutation = useMutation<{ coverLetter: string }, Error, typeof coverLetterForm>({
    mutationFn: async (formData: typeof coverLetterForm) => {
      if (!(activeResume as any)?.extractedText) {
        throw new Error("Please upload a resume first");
      }
      
      const response = await apiRequest('POST', '/api/copilot/cover-letter', {
        ...formData,
        resumeText: (activeResume as any).extractedText
      });
      return response.json();
    },
    onSuccess: () => {
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

  // Salary negotiation mutation
  const salaryNegotiationMutation = useMutation<{ strategy: string }, Error, typeof salaryForm>({
    mutationFn: async (formData: typeof salaryForm) => {
      if (!(activeResume as any)?.extractedText) {
        throw new Error("Please upload a resume first");
      }
      
      const response = await apiRequest('POST', '/api/copilot/salary-negotiation', {
        currentSalary: formData.currentSalary ? parseInt(formData.currentSalary.replace(/[^0-9]/g, '')) : 0,
        targetSalary: parseInt(formData.targetSalary.replace(/[^0-9]/g, '')),
        jobRole: formData.jobRole,
        location: formData.location,
        yearsExperience: parseInt(formData.yearsExperience)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Negotiation Strategy Generated!",
        description: "Your personalized salary negotiation strategy is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate negotiation strategy",
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

  const handleGenerateSalaryStrategy = () => {
    if (!salaryForm.targetSalary || !salaryForm.jobRole || !salaryForm.location || !salaryForm.yearsExperience) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (target salary, job role, location, years of experience)",
        variant: "destructive",
      });
      return;
    }
    salaryNegotiationMutation.mutate(salaryForm);
  };

  const content = (
    <>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Brain className="w-6 h-6" />
              AI Career Copilot
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your AI-powered career development assistant
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              Powered by GPT-5
            </Badge>
            <TourButton tourId="ai-copilot" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
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
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Your Resume Library</CardTitle>
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
                    ) : (tailoredResumes as any[]).length > 0 ? (
                      (tailoredResumes as any[]).map((resume: any) => (
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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedResumeContent(resume.tailoredContent || 'Resume content not available');
                                setSelectedResumeTitle(`${resume.jobTitle} - ${resume.company}`);
                                setViewResumeModal(true);
                              }}
                              data-testid={`view-resume-${resume.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`download-resume-${resume.id}`}>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
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
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
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
                          {coverLetterMutation.data?.coverLetter || 'Cover letter content will appear here...'}
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
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Salary Negotiation Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Get AI-powered negotiation strategies based on your resume, experience, skills, and qualifications.
                  </p>
                  
                  {activeResume && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-medium mb-2 text-green-800 dark:text-green-400">AI will analyze your resume for:</h4>
                      <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
                        <li>• Years of experience and career progression</li>
                        <li>• Technical skills and certifications</li>
                        <li>• Past achievements and quantifiable results</li>
                        <li>• Industry expertise and domain knowledge</li>
                        <li>• Education and professional qualifications</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentSalary">Current Salary (Optional)</Label>
                      <Input
                        id="currentSalary"
                        placeholder="e.g., $75,000"
                        value={salaryForm.currentSalary}
                        onChange={(e) => setSalaryForm(prev => ({ ...prev, currentSalary: e.target.value }))}
                        data-testid="input-current-salary"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="targetSalary">Target Salary</Label>
                      <Input
                        id="targetSalary"
                        placeholder="e.g., $95,000"
                        value={salaryForm.targetSalary}
                        onChange={(e) => setSalaryForm(prev => ({ ...prev, targetSalary: e.target.value }))}
                        data-testid="input-target-salary"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="jobRole">Job Role</Label>
                      <Input
                        id="jobRole"
                        placeholder="e.g., Senior Software Engineer"
                        value={salaryForm.jobRole}
                        onChange={(e) => setSalaryForm(prev => ({ ...prev, jobRole: e.target.value }))}
                        data-testid="input-job-role"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., San Francisco, CA"
                        value={salaryForm.location}
                        onChange={(e) => setSalaryForm(prev => ({ ...prev, location: e.target.value }))}
                        data-testid="input-location"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="yearsExperience">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        placeholder="e.g., 5"
                        type="number"
                        value={salaryForm.yearsExperience}
                        onChange={(e) => setSalaryForm(prev => ({ ...prev, yearsExperience: e.target.value }))}
                        data-testid="input-years-experience"
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateSalaryStrategy}
                      disabled={salaryNegotiationMutation.isPending || !(activeResume as any)?.extractedText}
                      data-testid="button-generate-salary-strategy"
                    >
                      {salaryNegotiationMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : !(activeResume as any)?.extractedText ? (
                        'Upload Resume First'
                      ) : (
                        'Generate Personalized Negotiation Strategy'
                      )}
                    </Button>
                    
                    {salaryNegotiationMutation.data && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Salary Negotiation Strategy:</h4>
                        <div className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                          {salaryNegotiationMutation.data.strategy || 'Negotiation strategy will appear here...'}
                        </div>
                        <Button size="sm" className="mt-2" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Download Strategy
                        </Button>
                      </div>
                    )}
                    
                    {!activeResume && (
                      <p className="text-sm text-orange-600">
                        Please upload a resume first. AI will analyze your experience, skills, and qualifications to create a personalized negotiation strategy.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
      
      {/* View Resume Modal */}
      <Dialog open={viewResumeModal} onOpenChange={setViewResumeModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tailored Resume - {selectedResumeTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {selectedResumeContent}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return embedded ? content : (
    <Layout>
      {content}
    </Layout>
  );
}