import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Brain,
  Target,
  BookOpen,
  Video,
  Users,
  Clock,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { TourButton } from '@/components/TourButton';

interface MockQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tips: string[];
}

interface PrepResource {
  id: string;
  title: string;
  type: 'course' | 'video' | 'article' | 'practice';
  url: string;
  description: string;
  duration?: string;
  provider: string;
  rating?: number;
}

export function InterviewPrep({ embedded = false }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState('questions');
  const [selectedApplication, setSelectedApplication] = useState('');
  const [questionCategory, setQuestionCategory] = useState('behavioral');
  const { toast } = useToast();

  // Fetch applications with applied status
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/applications'],
    select: (data: any[]) => data.filter(app => app.status === 'applied'),
  });

  // Fetch mock questions (only when questions tab is active)
  const { data: mockQuestions = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery<MockQuestion[]>({
    queryKey: ['/api/interview-prep/questions', selectedApplication, questionCategory],
    enabled: !!selectedApplication && activeTab === 'questions',
  });

  // Fetch prep resources (only when resources tab is active)
  const { data: prepResources = [], isLoading: resourcesLoading } = useQuery<PrepResource[]>({
    queryKey: [`/api/interview-prep/resources?applicationId=${selectedApplication}`],
    enabled: !!selectedApplication && activeTab === 'resources',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Generate questions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: async (data: { applicationId: string; category: string; count: number }) => {
      const response = await apiRequest('POST', '/api/interview-prep/generate-questions', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Set the query cache directly to the returned questions for immediate UI update
      queryClient.setQueryData(['/api/interview-prep/questions', selectedApplication, questionCategory], data);
      toast({
        title: "Questions Generated!",
        description: "New mock interview questions are ready for practice.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate questions",
        variant: "destructive",
      });
    }
  });

  const handleGenerateQuestions = () => {
    if (!selectedApplication) {
      toast({
        title: "Select Application",
        description: "Please select an application to generate questions for.",
        variant: "destructive",
      });
      return;
    }

    generateQuestionsMutation.mutate({
      applicationId: selectedApplication,
      category: questionCategory,
      count: 10
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'technical': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'situational': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'company': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400';
      case 'intermediate': return 'text-yellow-600 dark:text-yellow-400';
      case 'advanced': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'practice': return <Target className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  const content = (
    <>
      <div className="flex justify-end mb-4">
        <TourButton tourId="interview-prep" />
      </div>
      <div className="space-y-6">
        {/* Application Selector */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Application for Interview Prep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                  <SelectTrigger data-testid="select-application">
                    <SelectValue placeholder="Choose an application to prepare for..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.length > 0 ? (
                      applications.map((app: any) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.company} - {app.position} ({app.status})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-applied" disabled>
                        No applications with applied status
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {applications.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Applications with "applied" status will appear here for interview preparation.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedApplication && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions" className="flex items-center gap-2" data-testid="tab-questions">
                <Brain className="w-4 h-4" />
                Mock Questions
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2" data-testid="tab-resources">
                <BookOpen className="w-4 h-4" />
                Prep Resources
              </TabsTrigger>
            </TabsList>

            {/* Mock Questions Tab */}
            <TabsContent value="questions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">AI Mock Interview Questions</h2>
                <div className="flex gap-2">
                  <Select value={questionCategory} onValueChange={setQuestionCategory}>
                    <SelectTrigger className="w-40" data-testid="select-question-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="situational">Situational</SelectItem>
                      <SelectItem value="company">Company-Specific</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleGenerateQuestions}
                    disabled={generateQuestionsMutation.isPending}
                    data-testid="button-generate-questions"
                  >
                    {generateQuestionsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {questionsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading interview questions...</p>
                  </div>
                ) : mockQuestions.length > 0 ? (
                  mockQuestions.map((question: MockQuestion, index: number) => (
                    <Card key={question.id || index} data-testid={`card-question-${index}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge className={getCategoryColor(question.category)}>
                            {question.category}
                          </Badge>
                          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <h3 className="font-medium text-lg" data-testid={`text-question-${index}`}>{question.question}</h3>
                        {question.tips && question.tips.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Answer Tips:
                            </h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              {question.tips.map((tip: string, tipIndex: number) => (
                                <li key={tipIndex} className="flex items-start gap-2" data-testid={`tip-${index}-${tipIndex}`}>
                                  <span className="text-green-600 mt-1">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="empty-questions">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No questions generated yet.</p>
                    <p className="text-sm">Click "Generate Questions" to create personalized interview questions!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Prep Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <h2 className="text-2xl font-bold">Preparation Resources</h2>
              
              <div className="grid gap-4">
                {resourcesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading preparation resources...</p>
                  </div>
                ) : prepResources.length > 0 ? (
                  prepResources.map((resource: PrepResource, index: number) => (
                    <Card key={resource.id} data-testid={`card-resource-${index}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getResourceIcon(resource.type)}
                              <h3 className="font-medium" data-testid={`text-resource-title-${index}`}>{resource.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {resource.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {resource.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>By {resource.provider}</span>
                              {resource.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {resource.duration}
                                </span>
                              )}
                              {resource.rating && (
                                <span>★ {resource.rating}/5</span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild data-testid={`button-open-resource-${index}`}>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="empty-resources">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No preparation resources available yet.</p>
                    <p className="text-sm">Resources will be curated based on your selected application.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );

  return embedded ? content : (
    <Layout>
      {content}
    </Layout>
  );
}