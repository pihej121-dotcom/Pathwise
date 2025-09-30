import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  MapPin, 
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Sparkles,
  Award
} from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  type: 'volunteer' | 'internship' | 'hackathon' | 'competition' | 'apprenticeship' | 'externship';
  duration: string;
  url: string;
  description: string;
  remote: boolean;
  deadline?: string;
  source: string;
  relevanceScore?: number;
  matchReason?: string;
}

export default function BeyondJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState(user?.location || "");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [currentLimit, setCurrentLimit] = useState(5);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ["/api/beyond-jobs/search", keyword, location, selectedType, remoteOnly, currentLimit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (location) params.append('location', location);
      if (selectedType && selectedType !== 'all') params.append('type', selectedType);
      params.append('remote', String(remoteOnly));
      params.append('limit', String(currentLimit));
      
      const response = await fetch(`/api/beyond-jobs/search?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search opportunities');
      }
      
      return response.json();
    },
    enabled: false,
  });

  const { data: savedOpportunities = [] } = useQuery({
    queryKey: ["/api/beyond-jobs/saved"],
  });

  const saveOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: Opportunity) => {
      return apiRequest("/api/beyond-jobs/save", {
        method: "POST",
        body: JSON.stringify({ opportunityData }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Opportunity saved",
        description: "Added to your saved opportunities",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save",
        description: "Could not save this opportunity",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    refetch();
  };

  const handleLoadMore = () => {
    setCurrentLimit(prev => prev + 5);
    refetch();
  };

  const opportunities = searchResults?.opportunities || [];
  const isSaved = (oppId: string) => 
    savedOpportunities.some((saved: any) => saved.opportunity.externalId === oppId);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      volunteer: "bg-green-100 text-green-800",
      internship: "bg-blue-100 text-blue-800",
      hackathon: "bg-purple-100 text-purple-800",
      competition: "bg-orange-100 text-orange-800",
      apprenticeship: "bg-indigo-100 text-indigo-800",
      externship: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Beyond Jobs</h1>
          <p className="text-muted-foreground">
            Discover real experiential opportunities: volunteering, internships, hackathons, and more
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keyword</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., data science, design..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="apprenticeship">Apprenticeship</SelectItem>
                      <SelectItem value="externship">Externship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="City, State, or Remote"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Remote only</span>
                </label>

                <Button onClick={handleSearch} className="ml-auto">
                  <Search className="h-4 w-4 mr-2" />
                  Search Opportunities
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Searching opportunities...</p>
          </div>
        )}

        {!isLoading && opportunities.length === 0 && searchResults && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No real opportunities found right now. Please adjust filters or try again later.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && opportunities.length > 0 && (
          <div className="space-y-4">
            {opportunities.map((opp: Opportunity) => (
              <Card key={opp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{opp.title}</h3>
                            <Badge className={getTypeColor(opp.type)}>
                              {opp.type}
                            </Badge>
                            {opp.remote && (
                              <Badge variant="outline">Remote</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">{opp.organization}</p>
                        </div>
                      </div>

                      <p className="text-sm">{opp.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {opp.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {opp.duration}
                        </div>
                        {opp.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Deadline: {new Date(opp.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {opp.matchReason && (
                        <div className="flex items-start gap-2 bg-primary/5 p-3 rounded-lg">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                          <p className="text-sm text-primary">{opp.matchReason}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={opp.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </a>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveOpportunityMutation.mutate(opp)}
                          disabled={isSaved(opp.id)}
                        >
                          {isSaved(opp.id) ? (
                            <><BookmarkCheck className="h-4 w-4 mr-2" /> Saved</>
                          ) : (
                            <><Bookmark className="h-4 w-4 mr-2" /> Save</>
                          )}
                        </Button>

                        <Badge variant="secondary" className="ml-auto">
                          <Award className="h-3 w-3 mr-1" />
                          {opp.source}
                        </Badge>
                      </div>
                    </div>

                    {opp.relevanceScore && (
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-primary">{opp.relevanceScore}%</div>
                        <div className="text-xs text-muted-foreground">Match</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {opportunities.length >= currentLimit && (
              <div className="text-center">
                <Button onClick={handleLoadMore} variant="outline">
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Saved Opportunities */}
        {savedOpportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookmarkCheck className="h-5 w-5" />
                Saved Opportunities ({savedOpportunities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedOpportunities.slice(0, 3).map((saved: any) => (
                  <div key={saved.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{saved.opportunity.title}</p>
                      <p className="text-sm text-muted-foreground">{saved.opportunity.organization}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <a href={saved.opportunity.applicationUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
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
