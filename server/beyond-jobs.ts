import xml2js from 'xml2js';

export interface BeyondJobsOpportunity {
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
}

export class BeyondJobsService {
  private rapidApiKey = process.env.RAPIDAPI_KEY || "";
  
  constructor() {
    if (this.rapidApiKey) {
      console.log("RapidAPI key loaded for Beyond Jobs opportunities");
    } else {
      console.warn("RapidAPI key not found - internship data will be limited");
    }
    
    console.log("Beyond Jobs service initialized with free APIs: Challenge.gov, RapidAPI Internships, GitHub");
  }
  
  async searchOpportunities(params: {
    type?: string;
    location?: string;
    keyword?: string;
    remote?: boolean;
    limit?: number;
  }): Promise<BeyondJobsOpportunity[]> {
    const opportunities: BeyondJobsOpportunity[] = [];
    const limit = params.limit || 5;
    
    // Fetch from multiple sources in parallel
    const sources = await Promise.allSettled([
      this.fetchChallengeGovOpportunities(params),
      this.fetchRapidApiInternships(params),
      this.fetchGitHubInternships(params)
    ]);
    
    // Combine results from all sources
    sources.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        opportunities.push(...result.value);
      } else {
        const sourceName = ['Challenge.gov', 'RapidAPI', 'GitHub'][index];
        console.error(`Failed to fetch from ${sourceName}:`, result.reason?.message || result.reason);
      }
    });
    
    // Filter and limit results
    let filtered = opportunities;
    
    if (params.type && params.type !== 'all') {
      filtered = filtered.filter(opp => opp.type === params.type);
    }
    
    if (params.remote !== undefined) {
      filtered = filtered.filter(opp => opp.remote === params.remote);
    }
    
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(keyword) ||
        opp.description.toLowerCase().includes(keyword) ||
        opp.organization.toLowerCase().includes(keyword)
      );
    }
    
    // Return only the requested number of results
    return filtered.slice(0, limit);
  }
  
  private async fetchChallengeGovOpportunities(params: any): Promise<BeyondJobsOpportunity[]> {
    try {
      // Challenge.gov XML feed
      const response = await fetch('https://www.challenge.gov/challenges.xml', {
        headers: {
          'User-Agent': 'Pathwise-BeyondJobs/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Challenge.gov returned ${response.status}`);
      }
      
      const xmlText = await response.text();
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlText);
      
      const challenges = result?.challenges?.challenge || [];
      const challengeArray = Array.isArray(challenges) ? challenges : [challenges];
      
      return challengeArray
        .filter((c: any) => c && c.title)
        .slice(0, 3)
        .map((challenge: any) => ({
          id: `challenge-${challenge.id || Math.random().toString(36).substr(2, 9)}`,
          title: challenge.title || 'Untitled Challenge',
          organization: challenge.agency || 'U.S. Government',
          location: 'Remote',
          type: 'competition' as const,
          duration: this.extractDuration(challenge),
          url: challenge.url || `https://www.challenge.gov/challenge/${challenge.id}`,
          description: this.cleanDescription(challenge.description || challenge.summary || ''),
          remote: true,
          deadline: challenge['submission-end'] || undefined,
          source: 'challenge.gov'
        }));
    } catch (error: any) {
      console.error('Challenge.gov fetch error:', error.message);
      return [];
    }
  }
  
  private async fetchRapidApiInternships(params: any): Promise<BeyondJobsOpportunity[]> {
    if (!this.rapidApiKey) {
      console.log('RapidAPI key not available, skipping internship fetch');
      return [];
    }
    
    try {
      const searchQuery = params.keyword || 'internship';
      const location = params.location || 'United States';
      
      const response = await fetch(
        `https://internships-api.p.rapidapi.com/internships?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`,
        {
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'internships-api.p.rapidapi.com'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`RapidAPI returned ${response.status}`);
      }
      
      const data = await response.json();
      const internships = data.internships || data.results || [];
      
      return internships
        .slice(0, 3)
        .map((internship: any) => ({
          id: `rapidapi-${internship.id || Math.random().toString(36).substr(2, 9)}`,
          title: internship.title || internship.job_title || 'Internship Position',
          organization: internship.company || internship.company_name || 'Company',
          location: internship.location || location,
          type: 'internship' as const,
          duration: internship.duration || 'Summer',
          url: internship.url || internship.apply_url || '#',
          description: this.cleanDescription(internship.description || ''),
          remote: internship.remote || internship.is_remote || false,
          deadline: internship.deadline || undefined,
          source: 'rapidapi'
        }));
    } catch (error: any) {
      console.error('RapidAPI fetch error:', error.message);
      return [];
    }
  }
  
  private async fetchGitHubInternships(params: any): Promise<BeyondJobsOpportunity[]> {
    try {
      // Fetch from SimplifyJobs Summer 2026 Internships GitHub repo
      const response = await fetch(
        'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json',
        {
          headers: {
            'User-Agent': 'Pathwise-BeyondJobs/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`GitHub fetch returned ${response.status}`);
      }
      
      const listings = await response.json();
      const internships = Array.isArray(listings) ? listings : [];
      
      // Filter for active internships
      const activeInternships = internships
        .filter((listing: any) => listing && listing.active !== false)
        .slice(0, 3);
      
      return activeInternships.map((listing: any) => ({
        id: `github-${listing.id || Math.random().toString(36).substr(2, 9)}`,
        title: listing.company_name ? `${listing.company_name} Internship` : 'Tech Internship',
        organization: listing.company_name || 'Tech Company',
        location: listing.locations?.join(', ') || 'Various Locations',
        type: 'internship' as const,
        duration: listing.season || 'Summer 2026',
        url: listing.url || listing.application_link || '#',
        description: listing.terms?.join(', ') || 'Software engineering internship opportunity',
        remote: listing.locations?.some((loc: string) => loc.toLowerCase().includes('remote')) || false,
        source: 'github'
      }));
    } catch (error: any) {
      console.error('GitHub internships fetch error:', error.message);
      return [];
    }
  }
  
  private extractDuration(challenge: any): string {
    if (challenge.duration) return challenge.duration;
    if (challenge['submission-start'] && challenge['submission-end']) {
      return 'Limited Time';
    }
    return 'Ongoing';
  }
  
  private cleanDescription(desc: string): string {
    if (!desc) return 'No description available';
    
    // Remove HTML tags
    let cleaned = desc.replace(/<[^>]*>/g, '');
    
    // Limit to 200 characters
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 197) + '...';
    }
    
    return cleaned;
  }
  
  async getAIRanking(
    opportunities: BeyondJobsOpportunity[],
    userSkills: string[],
    resumeGaps: any[]
  ): Promise<Array<BeyondJobsOpportunity & { relevanceScore: number; matchReason: string }>> {
    // This will be integrated with OpenAI service for GPT ranking
    // For now, return opportunities with basic scoring
    return opportunities.map(opp => ({
      ...opp,
      relevanceScore: Math.floor(Math.random() * 30) + 70, // Placeholder: 70-100
      matchReason: `This ${opp.type} opportunity can help develop skills in ${userSkills.slice(0, 2).join(', ')}.`
    }));
  }
}

export const beyondJobsService = new BeyondJobsService();
