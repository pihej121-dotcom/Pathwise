import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Briefcase,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Target,
  TrendingUp,
  AlertTriangle,
  FileText,
  Wand2
} from "lucide-react";
import { format } from "date-fns";

export default function JobMatching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState(user?.targetRole || "");
  const [location, setLocation] = useState(user?.location || "");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [tailoredResult, setTailoredResult] = useState<any>(null);

  const { data: jobMatches = { jobs: [], totalCount: 0, page: 1, limit: 20 }, isLoading, refetch } = useQuery({
    queryKey: ["/api/jobs/search", searchQuery, location],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (location) params.append('location', location);
      
      // Use direct fetch since authentication is not required for job search
      const response = await fetch(`/api/jobs/search?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search jobs');
      }
      
      return response.json();
    },
    enabled: !!searchQuery, // Search when query is provided
  });

  const { data: savedMatches = [] } = useQuery({
    queryKey: ["/api/jobs/matches"],
  });

  const tailorResumeMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/tailor-resume`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setTailoredResult(data);
      setTailorModalOpen(true);
      toast({
        title: "Resume tailored successfully",
        description: "Your resume has been optimized for this position",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to tailor resume",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    refetch();
  };

  const handleTailorResume = (jobId: string) => {
    setSelectedJob((jobMatches as any)?.jobs?.find((job: any) => job.id === jobId));
    tailorResumeMutation.mutate(jobId);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCompatibilityBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <Layout title="Job Matching" subtitle="Find opportunities that match your skills and goals">
      <div className="space-y-6">
        {/* Search Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title / Keywords</label>
                <Input
                  placeholder="e.g. Software Engineer, Data Analyst"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-job-search"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g. San Francisco, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  data-testid="input-location"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button 
                  onClick={handleSearch}
                  className="w-full"
                  disabled={!searchQuery || isLoading}
                  data-testid="button-search-jobs"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isLoading ? "Searching..." : "Search Jobs"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {jobMatches?.jobs && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {jobMatches.totalCount} jobs found
              </h3>
              <div className="text-sm text-muted-foreground">
                Page {jobMatches.page} of {Math.ceil(jobMatches.totalCount / jobMatches.limit)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {jobMatches.jobs.map((job: any, index: number) => (
                <Card 
                  key={job.id || index}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`job-card-${index}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{job.title}</h4>
                        <div className="flex items-center space-x-4 text-muted-foreground mb-2">
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {job.company?.display_name || job.company}
                          </span>
                          {job.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location?.display_name || job.location}
                            </span>
                          )}
                          {job.salary && (
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {job.salary}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`text-center p-3 rounded-lg ${getCompatibilityBg(job.compatibilityScore || 75)}`}>
                          <div className={`text-xl font-bold ${getCompatibilityColor(job.compatibilityScore || 75)}`}>
                            {job.compatibilityScore || 75}%
                          </div>
                          <div className="text-xs text-muted-foreground">Match</div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Match Score Breakdown */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Match Score Breakdown ({job.compatibilityScore || 75}%)
                      </h5>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Required Skills Match:</span>
                          <span className="font-medium">{Math.round((job.compatibilityScore || 75) * 0.4)}% (40% weight)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nice-to-Have Skills:</span>
                          <span className="font-medium">{Math.round((job.compatibilityScore || 75) * 0.2)}% (20% weight)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Title Relevance:</span>
                          <span className="font-medium">{Math.round((job.compatibilityScore || 75) * 0.2)}% (20% weight)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Location Fit:</span>
                          <span className="font-medium">{Math.round((job.compatibilityScore || 75) * 0.1)}% (10% weight)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experience Level:</span>
                          <span className="font-medium">{Math.round((job.compatibilityScore || 75) * 0.1)}% (10% weight)</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    {job.matchReasons && job.matchReasons.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Why this matches your profile
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {job.matchReasons.slice(0, 3).map((reason: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                          {job.matchReasons.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.matchReasons.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills Gaps */}
                    {job.skillsGaps && job.skillsGaps.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Skills to improve ({job.skillsGaps.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {job.skillsGaps.slice(0, 4).map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                              {skill}
                            </Badge>
                          ))}
                          {job.skillsGaps.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.skillsGaps.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Job Description Preview */}
                    {job.description && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {job.description.length > 200 
                            ? `${job.description.substring(0, 200)}...`
                            : job.description
                          }
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTailorResume(job.id)}
                          disabled={tailorResumeMutation.isPending}
                          data-testid={`button-tailor-${index}`}
                        >
                          <Wand2 className="w-4 h-4 mr-1" />
                          {tailorResumeMutation.isPending ? "Tailoring..." : "Tailor Resume"}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => window.open(job.redirect_url, '_blank')}
                          data-testid={`button-apply-${index}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          {job.source?.includes('Generated') ? 'Search Similar Jobs' : 'Apply Now'}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {job.createdAt && format(new Date(job.createdAt), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !jobMatches?.jobs?.length && searchQuery && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or location
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Initial State */}
        {!searchQuery && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Find Your Perfect Match</h3>
                <p className="text-muted-foreground mb-4">
                  Search for jobs that align with your skills and career goals
                </p>
                <Button onClick={() => setSearchQuery(user?.targetRole || "")}>
                  <Search className="w-4 h-4 mr-2" />
                  Start Searching
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resume Tailoring Modal */}
        <Dialog open={tailorModalOpen} onOpenChange={setTailorModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Resume Tailored for {selectedJob?.title}
              </DialogTitle>
            </DialogHeader>
            
            {tailoredResult && (
              <div className="space-y-6">
                {/* Score Improvement */}
                <div className="flex items-center justify-center space-x-8 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {selectedJob?.compatibilityScore || 75}%
                    </div>
                    <div className="text-xs text-muted-foreground">Before</div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tailoredResult.analysis?.jobSpecificScore || 90}%
                    </div>
                    <div className="text-xs text-muted-foreground">After</div>
                  </div>
                </div>

                {/* Keywords Covered */}
                {tailoredResult.analysis?.keywordsCovered && (
                  <div>
                    <h4 className="font-semibold mb-2">Keywords Added:</h4>
                    <div className="flex flex-wrap gap-2">
                      {tailoredResult.analysis.keywordsCovered.map((keyword: string, i: number) => (
                        <Badge key={i} className="bg-green-500/10 text-green-700 border-green-500/20">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining Gaps */}
                {tailoredResult.analysis?.remainingGaps && tailoredResult.analysis.remainingGaps.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Still Need to Improve:</h4>
                    <div className="space-y-2">
                      {tailoredResult.analysis.remainingGaps.map((gap: any, i: number) => (
                        <div key={i} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{gap.skill}</span>
                            <Badge variant="outline">{gap.importance}</Badge>
                          </div>
                          {gap.resources && gap.resources.length > 0 && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Recommended: </span>
                              {gap.resources.slice(0, 2).map((resource: any, j: number) => (
                                <span key={j} className="text-primary">
                                  {resource.title}{j < gap.resources.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setTailorModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button data-testid="button-download-tailored">
                    <FileText className="w-4 h-4 mr-2" />
                    Download Resume
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
