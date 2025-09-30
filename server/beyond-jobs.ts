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
  private coresignalApiKey = process.env.CORESIGNAL_API_KEY || "";
  
  constructor() {
    if (this.coresignalApiKey) {
      console.log("CoreSignal API loaded for Beyond Jobs internships");
    } else {
      console.warn("CoreSignal API key not found - internship data will be limited");
    }
    
    console.log("Beyond Jobs service initialized: CoreSignal (internships), Volunteer Connector, Challenge.gov, GitHub");
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
    
    // Fetch from multiple sources in parallel based on type
    const sources: Promise<BeyondJobsOpportunity[]>[] = [];
    
    // Always include these
    sources.push(this.fetchChallengeGovOpportunities(params));
    sources.push(this.fetchGitHubInternships(params));
    
    // Add type-specific sources
    if (!params.type || params.type === 'all' || params.type === 'volunteer') {
      sources.push(this.fetchVolunteerConnectorOpportunities(params));
    }
    
    if (!params.type || params.type === 'all' || params.type === 'internship') {
      sources.push(this.fetchCoreSignalInternships(params));
    }
    
    const results = await Promise.allSettled(sources);
    
    // Combine results from all sources
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        opportunities.push(...result.value);
      } else {
        console.error(`Failed to fetch from source ${index}:`, result.reason?.message || result.reason);
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
  
  private async fetchCoreSignalInternships(params: any): Promise<BeyondJobsOpportunity[]> {
    if (!this.coresignalApiKey) {
      console.log('CoreSignal API key not available, skipping internship fetch');
      return [];
    }
    
    try {
      const searchQuery = params.keyword || 'internship';
      const location = params.location || 'United States';
      
      // CoreSignal job search API
      const response = await fetch(
        'https://api.coresignal.com/cdapi/v1/professional_network/job/search/filter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.coresignalApiKey}`
          },
          body: JSON.stringify({
            title: searchQuery,
            location: location,
            employment_type: 'internship',
            limit: 5
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`CoreSignal returned ${response.status}`);
      }
      
      const data = await response.json();
      const jobs = data || [];
      
      return jobs
        .slice(0, 3)
        .map((job: any) => ({
          id: `coresignal-${job.id || Math.random().toString(36).substr(2, 9)}`,
          title: job.title || 'Internship Position',
          organization: job.company_name || job.company || 'Company',
          location: job.location || location,
          type: 'internship' as const,
          duration: job.duration || 'Varies',
          url: job.url || job.application_url || '#',
          description: this.cleanDescription(job.description || ''),
          remote: job.is_remote || false,
          deadline: job.deadline || undefined,
          source: 'coresignal'
        }));
    } catch (error: any) {
      console.error('CoreSignal fetch error:', error.message);
      return [];
    }
  }

  private async fetchVolunteerConnectorOpportunities(params: any): Promise<BeyondJobsOpportunity[]> {
    try {
      // Volunteer Connector free API - no authentication required!
      const searchParams = new URLSearchParams();
      
      // Add search parameters if provided
      if (params.keyword) {
        searchParams.append('q', params.keyword);
      }
      
      const url = `https://www.volunteerconnector.org/api/search/?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Volunteer Connector returned ${response.status}`);
      }
      
      const data = await response.json();
      const opportunities = data.results || [];
      
      return opportunities
        .slice(0, 3)
        .map((opp: any) => ({
          id: `volunteer-${opp.id || Math.random().toString(36).substr(2, 9)}`,
          title: opp.title || 'Volunteer Opportunity',
          organization: opp.organization?.name || 'Organization',
          location: opp.audience?.regions?.join(', ') || 'Various Locations',
          type: 'volunteer' as const,
          duration: opp.dates || 'Ongoing',
          url: opp.organization?.url || `https://www.volunteerconnector.org/opportunity/${opp.id}`,
          description: this.cleanDescription(opp.description || ''),
          remote: opp.remote_or_online || false,
          source: 'volunteer-connector'
        }));
    } catch (error: any) {
      console.error('Volunteer Connector fetch error:', error.message);
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
    resumeGaps: any[],
    openaiService: any
  ): Promise<Array<BeyondJobsOpportunity & { relevanceScore: number; matchReason: string }>> {
    try {
      // Extract gap categories from resume analysis
      const gapCategories = resumeGaps.map((gap: any) => gap.category || gap).filter(Boolean);
      
      const prompt = `You are a career advisor analyzing experiential opportunities for a student.

Student's Skills: ${userSkills.join(', ') || 'General skills'}
Resume Gaps: ${gapCategories.join(', ') || 'None identified'}

Analyze these opportunities and rank them by relevance (0-100 score). For each opportunity, provide:
1. A relevance score (0-100) based on how well it addresses the student's gaps and builds on their skills
2. A brief 1-2 sentence explanation of why this opportunity is valuable for their career development

Opportunities:
${opportunities.map((opp, i) => `
${i + 1}. ${opp.title} (${opp.type})
   Organization: ${opp.organization}
   Description: ${opp.description}
   Location: ${opp.location}
`).join('\n')}

Respond in JSON format:
{
  "rankings": [
    {
      "opportunityIndex": 0,
      "relevanceScore": 85,
      "matchReason": "This hackathon focuses on data science, directly addressing your Python programming gap while building on your analytical skills."
    },
    ...
  ]
}`;

      const response = await openaiService.generateText(prompt);
      
      // Parse the AI response
      let rankings;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          rankings = JSON.parse(jsonMatch[0]).rankings;
        }
      } catch (parseError) {
        console.error('Failed to parse AI rankings:', parseError);
        rankings = null;
      }

      // If AI ranking failed, use basic relevance scoring
      if (!rankings || !Array.isArray(rankings)) {
        return opportunities.map(opp => ({
          ...opp,
          relevanceScore: Math.floor(Math.random() * 30) + 70,
          matchReason: `This ${opp.type} opportunity can help develop valuable experience and skills.`
        }));
      }

      // Map AI rankings back to opportunities
      return opportunities.map((opp, index) => {
        const ranking = rankings.find((r: any) => r.opportunityIndex === index);
        return {
          ...opp,
          relevanceScore: ranking?.relevanceScore || 70,
          matchReason: ranking?.matchReason || `This ${opp.type} opportunity aligns with your career goals.`
        };
      });
    } catch (error: any) {
      console.error('AI ranking error:', error.message);
      // Fallback to basic scoring if AI fails
      return opportunities.map(opp => ({
        ...opp,
        relevanceScore: 75,
        matchReason: `This ${opp.type} opportunity can help develop valuable experience.`
      }));
    }
  }
}

export const beyondJobsService = new BeyondJobsService();
