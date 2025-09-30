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

    console.log("Beyond Jobs service initialized: CoreSignal (internships), Volunteer Connector (free), GitHub");
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

    // Sources
    const sources: Promise<BeyondJobsOpportunity[]>[] = [];
    sources.push(this.fetchGitHubInternships(params)); // always include GitHub

    if (!params.type || params.type === 'all' || params.type === 'volunteer') {
      sources.push(this.fetchVolunteerConnectorOpportunities(params));
    }

    if (!params.type || params.type === 'all' || params.type === 'internship') {
      sources.push(this.fetchCoreSignalInternships(params));
    }

    const results = await Promise.allSettled(sources);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        opportunities.push(...result.value);
      } else {
        console.error(`Failed to fetch from source ${index}:`, result.reason?.message || result.reason);
      }
    });

    // Filters
    let filtered = opportunities;
    console.log(`Before filtering: ${opportunities.length} opportunities`);

    if (params.type && params.type !== 'all') {
      filtered = filtered.filter(opp => opp.type === params.type);
      console.log(`After type filter (${params.type}): ${filtered.length} opportunities`);
    }

    if (params.remote !== undefined) {
      filtered = filtered.filter(opp => opp.remote === params.remote);
      console.log(`After remote filter: ${filtered.length} opportunities`);
    }

    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      console.log(`Applying keyword filter: "${keyword}"`);
      console.log(`Sample opportunity before filter:`, filtered[0]);
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(keyword) ||
        opp.description.toLowerCase().includes(keyword) ||
        opp.organization.toLowerCase().includes(keyword)
      );
      console.log(`After keyword filter: ${filtered.length} opportunities`);
    }

    console.log(`Final result: ${filtered.length} opportunities (limit: ${limit})`);
    return filtered.slice(0, limit);
  }

  /** Fetch internships from CoreSignal API */
  private async fetchCoreSignalInternships(params: any): Promise<BeyondJobsOpportunity[]> {
    if (!this.coresignalApiKey) {
      console.log('CoreSignal API key not available, skipping internship fetch');
      return [];
    }

    try {
      const searchQuery = params.keyword || 'internship';

      const response = await fetch(
        'https://api.coresignal.com/cdapi/v2/job_base/search/filter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': this.coresignalApiKey
          },
          body: JSON.stringify({
            filters: [
              { name: "title", type: "contains", value: searchQuery },
              { name: "employment_type", type: "equals", value: "Internship" },
              { name: "application_active", type: "equals", value: true }
            ],
            size: 10
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CoreSignal returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const jobs = Array.isArray(data) ? data : data.data || [];

      return jobs.slice(0, 3).map((job: any) => ({
        id: `coresignal-${job.id || Math.random().toString(36).substr(2, 9)}`,
        title: job.title || 'Internship Position',
        organization: job.company || 'Company',
        location: job.location || 'Remote',
        type: 'internship',
        duration: 'Varies',
        url: job.url || '#',
        description: this.cleanDescription(job.description || ''),
        remote: job.location?.toLowerCase().includes('remote') || false,
        source: 'coresignal'
      }));
    } catch (error: any) {
      console.error('CoreSignal fetch error:', error.message);
      return [];
    }
  }

  /** Fetch volunteer opportunities from VolunteerConnector */
  private async fetchVolunteerConnectorOpportunities(params: any): Promise<BeyondJobsOpportunity[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params.keyword) {
        searchParams.append('q', params.keyword);
      }

      const url = `https://www.volunteerconnector.org/api/search/?${searchParams.toString()}`;

      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Volunteer Connector returned ${response.status}`);

      const data = await response.json();
      const opportunities = data.data || []; // ✅ fix: VolunteerConnector uses `data`

      return opportunities.slice(0, 3).map((opp: any) => ({
        id: `volunteer-${opp.id || Math.random().toString(36).substr(2, 9)}`,
        title: opp.title || 'Volunteer Opportunity',
        organization: opp.organization?.name || 'Organization',
        location: opp.audience?.regions?.join(', ') || 'Various Locations',
        type: 'volunteer',
        duration: opp.dates || 'Ongoing',
        url: opp.organization?.url || `https://www.volunteerconnector.org/opportunity/${opp.id}`,
        description: this.cleanDescription(opp.description || ''),
        remote: !!opp.remote || !!opp.remote_or_online,
        source: 'volunteer-connector'
      }));
    } catch (error: any) {
      console.error('Volunteer Connector fetch error:', error.message);
      return [];
    }
  }

  /** Fetch internships from GitHub Simplify repo */
  private async fetchGitHubInternships(params: any): Promise<BeyondJobsOpportunity[]> {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json',
        { headers: { 'User-Agent': 'Pathwise-BeyondJobs/1.0' } }
      );

      if (!response.ok) throw new Error(`GitHub fetch returned ${response.status}`);

      const listings = await response.json();
      const internships = Array.isArray(listings) ? listings : [];

      if (!internships.length) console.warn("No internships found from GitHub source");

      const activeInternships = internships.filter((l: any) => l && l.active !== false).slice(0, 3);

      return activeInternships.map((listing: any) => ({
        id: `github-${listing.id || Math.random().toString(36).substr(2, 9)}`,
        title: listing.title || `${listing.company_name || 'Company'} Internship`,
        organization: listing.company_name || 'Tech Company',
        location: listing.locations?.join(', ') || 'Various Locations',
        type: 'internship',
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

  /** Utility: clean description */
  private cleanDescription(desc: string): string {
    if (!desc) return 'No description available';
    let cleaned = desc.replace(/<[^>]*>/g, '');
    if (cleaned.length > 200) cleaned = cleaned.substring(0, 197) + '...';
    return cleaned;
  }

  /** Rank opportunities using GPT */
  async getAIRanking(
    opportunities: BeyondJobsOpportunity[],
    userSkills: string[],
    resumeGaps: any[],
    openaiService: any
  ): Promise<Array<BeyondJobsOpportunity & { relevanceScore: number; matchReason: string }>> {
    try {
      const gapCategories = resumeGaps.map((gap: any) => gap.category || gap).filter(Boolean);

      const prompt = `You are a career advisor analyzing experiential opportunities for a student.

Student's Skills: ${userSkills.join(', ') || 'General skills'}
Resume Gaps: ${gapCategories.join(', ') || 'None identified'}

Analyze these opportunities and rank them by relevance (0-100 score). For each opportunity, provide:
1. A relevance score (0-100)
2. A 1-2 sentence explanation

Opportunities:
${opportunities.map((opp, i) => `
${i + 1}. ${opp.title} (${opp.type})
   Organization: ${opp.organization}
   Description: ${opp.description}
   Location: ${opp.location}
`).join('\n')}

Respond in JSON with this format:
{ "rankings": [ { "opportunityIndex": 0, "relevanceScore": 85, "matchReason": "..." } ] }`;

      const response = await openaiService.generateText(prompt);

      let rankings;
      try {
        const cleanResponse = response.replace(/```json|```/g, '').trim(); // ✅ fix
        rankings = JSON.parse(cleanResponse).rankings;
      } catch (parseError) {
        console.error('Failed to parse AI rankings:', parseError);
        rankings = null;
      }

      if (!rankings || !Array.isArray(rankings)) {
        return opportunities.map(opp => ({
          ...opp,
          relevanceScore: Math.floor(Math.random() * 30) + 70,
          matchReason: `This ${opp.type} opportunity can help develop valuable skills.`
        }));
      }

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
      return opportunities.map(opp => ({
        ...opp,
        relevanceScore: 75,
        matchReason: `This ${opp.type} opportunity can help develop valuable experience.`
      }));
    }
  }
}

export const beyondJobsService = new BeyondJobsService();
