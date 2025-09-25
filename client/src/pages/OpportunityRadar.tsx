// CREATE client/src/pages/OpportunityRadar.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Clock, ExternalLink, Radar, Building, Users, Heart, GraduationCap } from 'lucide-react';

export default function OpportunityRadar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [location, setLocation] = useState("");

  // Fetch opportunities
  const { data: opportunityData, isLoading, refetch } = useQuery({
    queryKey: ["/api/opportunities/search", searchQuery, selectedCategory, location],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (location) params.append('location', location);
      params.append('limit', '50');
      
      const response = await fetch(`/api/opportunities/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch opportunities');
      return response.json();
    },
    enabled: false // Only search when user clicks search
  });

  // Fetch fresh opportunities for the radar view
  const { data: freshData, isLoading: freshLoading } = useQuery({
    queryKey: ["/api/opportunities/fresh"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch category stats
  const { data: categoryData } = useQuery({
    queryKey: ["/api/opportunities/categories"],
  });

  const handleSearch = () => {
    refetch();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research': return <GraduationCap className="w-4 h-4" />;
      case 'startup': return <Building className="w-4 h-4" />;
      case 'nonprofit': return <Heart className="w-4 h-4" />;
      case 'student-org': return <Users className="w-4 h-4" />;
      default: return <Radar className="w-4 h-4" />;
    }
  };

  const getCompensationColor = (compensation: string) => {
    switch (compensation) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'stipend': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'academic-credit': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'unpaid': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Radar className="w-8 h-8 text-primary animate-pulse" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Opportunity Radar
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover hidden opportunities beyond traditional job boards. Campus research, startup calls, nonprofit projects, and student leadership roles.
        </p>
      </div>

      {/* Category Overview */}
      {categoryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categoryData.categories.map((cat: any) => (
            <Card key={cat.name} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(cat.name)}
                  <div>
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-2xl font-bold text-primary">{cat.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Opportunities</TabsTrigger>
          <TabsTrigger value="live">Live Radar Feed</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          {/* Search Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keywords</label>
                  <Input
                    placeholder="e.g. research, startup, volunteer"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-opportunity-search"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="research">Campus Research</SelectItem>
                      <SelectItem value="startup">Startup Opportunities</SelectItem>
                      <SelectItem value="nonprofit">Nonprofit Projects</SelectItem>
                      <SelectItem value="student-org">Student Organizations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="e.g. Campus, Remote"
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
                    disabled={isLoading}
                    data-testid="button-search-opportunities"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {isLoading ? "Searching..." : "Search Opportunities"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {opportunityData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  Found {opportunityData.totalCount} Opportunities
                </h2>
              </div>
              
              <div className="grid gap-6">
                {opportunityData.opportunities.map((opp: any, index: number) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(opp.category)}
                            <CardTitle className="text-xl">{opp.title}</CardTitle>
                          </div>
                          <p className="text-lg font-medium text-primary">{opp.organization}</p>
                        </div>
                        <Badge className={getCompensationColor(opp.compensation)}>
                          {opp.compensation?.replace('-', ' ') || 'Unspecified'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {opp.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{opp.location || 'Location not specified'}</span>
                          {opp.isRemote && <Badge variant="outline">Remote</Badge>}
                        </div>
                        
                        {opp.estimatedHours && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{opp.estimatedHours} hrs/week • {opp.duration}</span>
                          </div>
                        )}
                      </div>

                      {opp.skills && opp.skills.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {opp.skills.map((skill: string, i: number) => (
                              <Badge key={i} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(opp.applicationUrl || opp.contactEmail) && (
                        <div className="flex space-x-3 pt-4">
                          {opp.applicationUrl && (
                            <Button 
                              size="sm" 
                              onClick={() => window.open(opp.applicationUrl, '_blank')}
                              data-testid={`button-apply-${index}`}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Apply Now
                            </Button>
                          )}
                          {opp.contactEmail && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`mailto:${opp.contactEmail}`, '_blank')}
                              data-testid={`button-contact-${index}`}
                            >
                              Contact
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Live Radar Tab */}
        <TabsContent value="live" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Radar className="w-5 h-5 animate-pulse" />
                <span>Live Opportunity Feed</span>
                <Badge variant="outline">Auto-updating</Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Fresh opportunities automatically aggregated from multiple sources. Updates every 5 minutes.
              </p>
            </CardHeader>
            <CardContent>
              {freshLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : freshData ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(freshData.lastUpdated).toLocaleString()}
                  </p>
                  <div className="grid gap-4">
                    {freshData.opportunities.slice(0, 10).map((opp: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{opp.title}</h3>
                          <Badge variant="outline">{opp.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{opp.organization}</p>
                        <p className="text-sm line-clamp-2">{opp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No fresh opportunities available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
