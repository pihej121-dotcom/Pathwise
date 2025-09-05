import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Target, Brain, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface JobMatchAnalysis {
  overallMatch: number;
  strengths: string[];
  concerns: string[];
  skillsAnalysis: {
    strongMatches: string[];
    partialMatches: string[];
    missingSkills: string[];
    explanation: string;
  };
  experienceAnalysis: {
    relevantExperience: string[];
    experienceGaps: string[];
    explanation: string;
  };
  recommendations: string[];
  nextSteps: string[];
}

interface PersonalizedMatchAnalysisProps {
  job: any;
}

export function PersonalizedMatchAnalysis({ job }: PersonalizedMatchAnalysisProps) {
  const [expanded, setExpanded] = useState(false);
  
  const { data: analysis, isLoading, error } = useQuery<JobMatchAnalysis>({
    queryKey: ['job-match-analysis', job.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/jobs/match-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ jobId: job.id, jobData: job })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    enabled: expanded, // Only fetch when user expands the analysis
  });

  if (!expanded) {
    return (
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-between text-sm font-medium"
          data-testid="button-expand-match-analysis"
        >
          <div className="flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            AI Match Analysis ({job.compatibilityScore || 75}%)
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-4 p-3 bg-muted/50 rounded-lg" data-testid="loading-match-analysis">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">AI analyzing your resume vs this job...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mb-4 p-3 bg-muted/50 rounded-lg" data-testid="error-match-analysis">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Match Score Breakdown ({job.compatibilityScore || 75}%)
          </h5>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">AI analysis temporarily unavailable. Showing basic compatibility score.</p>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3" data-testid="personalized-match-analysis">
      {/* Header with collapse button */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            AI Match Analysis ({analysis.overallMatch}%)
          </h5>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            data-testid="button-collapse-match-analysis"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Strengths */}
        <div className="mb-3">
          <h6 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Your Strengths for This Role:
          </h6>
          <div className="space-y-1">
            {analysis.strengths.map((strength, index) => (
              <div key={index} className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 p-1 rounded" data-testid={`strength-${index}`}>
                • {strength}
              </div>
            ))}
          </div>
        </div>

        {/* Concerns */}
        {analysis.concerns.length > 0 && (
          <div className="mb-3">
            <h6 className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Areas to Address:
            </h6>
            <div className="space-y-1">
              {analysis.concerns.map((concern, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-1 rounded" data-testid={`concern-${index}`}>
                  • {concern}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Analysis Sections */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" data-testid="button-expand-skills-analysis">
            <ChevronRight className="w-4 h-4 mr-1" />
            Skills Analysis Details
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-3 space-y-3">
              <p className="text-xs text-muted-foreground" data-testid="skills-explanation">{analysis.skillsAnalysis.explanation}</p>
              
              <div className="grid grid-cols-1 gap-2">
                {analysis.skillsAnalysis.strongMatches.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Strong Skill Matches:</h6>
                    <div className="flex flex-wrap gap-1">
                      {analysis.skillsAnalysis.strongMatches.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900" data-testid={`strong-skill-${index}`}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.skillsAnalysis.partialMatches.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Transferable Skills:</h6>
                    <div className="flex flex-wrap gap-1">
                      {analysis.skillsAnalysis.partialMatches.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs" data-testid={`partial-skill-${index}`}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.skillsAnalysis.missingSkills.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Skills to Develop:</h6>
                    <div className="flex flex-wrap gap-1">
                      {analysis.skillsAnalysis.missingSkills.map((skill, index) => (
                        <Badge key={index} variant="destructive" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" data-testid={`missing-skill-${index}`}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" data-testid="button-expand-experience-analysis">
            <ChevronRight className="w-4 h-4 mr-1" />
            Experience Analysis Details
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-3 space-y-3">
              <p className="text-xs text-muted-foreground" data-testid="experience-explanation">{analysis.experienceAnalysis.explanation}</p>
              
              <div className="grid grid-cols-1 gap-2">
                {analysis.experienceAnalysis.relevantExperience.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Relevant Experience:</h6>
                    <div className="space-y-1">
                      {analysis.experienceAnalysis.relevantExperience.map((exp, index) => (
                        <div key={index} className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 p-1 rounded" data-testid={`relevant-exp-${index}`}>
                          • {exp}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.experienceAnalysis.experienceGaps.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Experience Gaps:</h6>
                    <div className="space-y-1">
                      {analysis.experienceAnalysis.experienceGaps.map((gap, index) => (
                        <div key={index} className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-1 rounded" data-testid={`experience-gap-${index}`}>
                          • {gap}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Recommendations */}
      <Card>
        <CardContent className="p-3">
          <h6 className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center">
            <Lightbulb className="w-3 h-3 mr-1" />
            AI Recommendations:
          </h6>
          <div className="space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-1 rounded" data-testid={`recommendation-${index}`}>
                • {rec}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}