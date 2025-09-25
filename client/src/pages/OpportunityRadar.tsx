import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, Filter, MapPin, Clock, DollarSign, Users, Bookmark, 
  BookmarkCheck, ExternalLink, Calendar, Building, Tag, Zap
} from "lucide-react";
import type { SelectOpportunity } from "@shared/schema";

const categoryLabels = {
  research: "Research",
  startup: "Startup", 
  nonprofit: "Nonprofit",
  "student-org": "Student Org"
};

const compensationLabels = {
  paid: "Paid",
  unpaid: "Volunteer",
  stipend: "Stipend",
  "academic-credit": "Academic Credit"
};

export default function OpportunityRadar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCompensation, setSelectedCompensation] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch opportunities with filters
  const { data: opportunities = [], isLoading } = useQuery<SelectOpportunity[]>({
    queryKey: ['/api/opportunities', {
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      compensation: selectedCompensation === 'all' ? undefined : selectedCompensation,
      isRemote: isRemoteOnly || undefined,
      limit: 50
    }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch saved opportunities to mark them
  const { data: savedOpportunities = [] } = useQuery<SelectOpportunity[]>({
    queryKey: ['/api/opportunities/saved'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update saved opportunity IDs when data changes
  useEffect(() => {
    if (savedOpportunities && Array.isArray(savedOpportunities)) {
      setSavedOpportunityIds(new Set(savedOpportunities.map((opp: SelectOpportunity) => opp.id)));
    }
  }, [savedOpportunities]);

  // Save opportunity mutation
  const saveOpportunityMutation = useMutation({
    mutationFn: async ({ opportunityId, notes }: { opportunityId: string; notes?: string }) => {
      return apiRequest('/api/opportunities/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities/saved'] });
      toast({
        title: "Opportunity Saved",
        description: "Added to your saved opportunities",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save opportunity",
        variant: "destructive",
      });
    }
  });

  // Remove saved opportunity mutation
  const removeSavedMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest(`/api/opportunities/save/${opportunityId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities/saved'] });
      toast({
        title: "Opportunity Removed",
        description: "Removed from your saved opportunities",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to remove opportunity",
        variant: "destructive",
      });
    }
  });

  // Filter opportunities based on search term
  const filteredOpportunities = Array.isArray(opportunities) ? opportunities.filter((opportunity: SelectOpportunity) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      opportunity.title.toLowerCase().includes(searchLower) ||
      opportunity.organization.toLowerCase().includes(searchLower) ||
      opportunity.description.toLowerCase().includes(searchLower) ||
      (opportunity.skills && opportunity.skills.some(skill => skill.toLowerCase().includes(searchLower)))
    );
  }) : [];

  const handleSaveOpportunity = (opportunityId: string) => {
    if (savedOpportunityIds.has(opportunityId)) {
      removeSavedMutation.mutate(opportunityId);
      setSavedOpportunityIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });
    } else {
      saveOpportunityMutation.mutate({ opportunityId });
      setSavedOpportunityIds(prev => new Set(prev).add(opportunityId));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research': return <Zap className="h-4 w-4" />;
      case 'startup': return <Building className="h-4 w-4" />;
      case 'nonprofit': return <Users className="h-4 w-4" />;
      case 'student-org': return <Tag className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const formatDeadline = (deadline: Date | string | null) => {
    if (!deadline) return "No deadline";
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Deadline passed";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="opportunity-radar-page">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Opportunity Radar
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2" data-testid="page-description">
              Discover non-traditional opportunities including research positions, startup roles, nonprofit work, and campus leadership.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search opportunities, organizations, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]" data-testid="select-category">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  <SelectItem value="student-org">Student Org</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCompensation} onValueChange={setSelectedCompensation}>
                <SelectTrigger className="w-[140px]" data-testid="select-compensation">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Compensation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Volunteer</SelectItem>
                  <SelectItem value="stipend">Stipend</SelectItem>
                  <SelectItem value="academic-credit">Academic Credit</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={isRemoteOnly ? "default" : "outline"}
                onClick={() => setIsRemoteOnly(!isRemoteOnly)}
                data-testid="button-remote-filter"
              >
                Remote Only
              </Button>
            </div>
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-[300px]">
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredOpportunities.length === 0 ? (
            <div className="col-span-full text-center py-12" data-testid="no-opportunities">
              <div className="text-gray-500 dark:text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            </div>
          ) : (
            filteredOpportunities.map((opportunity: SelectOpportunity) => (
              <Card key={opportunity.id} className="h-fit hover:shadow-lg transition-shadow" data-testid={`card-opportunity-${opportunity.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight mb-2" data-testid={`text-title-${opportunity.id}`}>
                        {opportunity.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2" data-testid={`text-organization-${opportunity.id}`}>
                        {getCategoryIcon(opportunity.category)}
                        {opportunity.organization}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveOpportunity(opportunity.id)}
                      disabled={saveOpportunityMutation.isPending || removeSavedMutation.isPending}
                      data-testid={`button-save-${opportunity.id}`}
                    >
                      {savedOpportunityIds.has(opportunity.id) ? (
                        <BookmarkCheck className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3" data-testid={`text-description-${opportunity.id}`}>
                    {opportunity.description}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabels[opportunity.category as keyof typeof categoryLabels]}
                    </Badge>
                    {opportunity.compensation && (
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {compensationLabels[opportunity.compensation as keyof typeof compensationLabels]}
                      </Badge>
                    )}
                    {opportunity.isRemote && (
                      <Badge variant="outline" className="text-xs">Remote</Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {opportunity.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{opportunity.location}</span>
                      </div>
                    )}
                    {opportunity.estimatedHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{opportunity.estimatedHours}h/{opportunity.duration || 'week'}</span>
                      </div>
                    )}
                    {opportunity.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className={
                          new Date(opportunity.deadline) < new Date() ? 'text-red-600' : 
                          new Date(opportunity.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-orange-600' : ''
                        }>
                          {formatDeadline(opportunity.deadline)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {opportunity.skills && opportunity.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {opportunity.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {opportunity.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{opportunity.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {opportunity.applicationUrl && (
                    <Button asChild className="w-full" data-testid={`button-apply-${opportunity.id}`}>
                      <a href={opportunity.applicationUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Now
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results count */}
        {!isLoading && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300" data-testid="results-count">
            Showing {filteredOpportunities.length} of {Array.isArray(opportunities) ? opportunities.length : 0} opportunities
          </div>
        )}
      </div>
    </div>
  );
}