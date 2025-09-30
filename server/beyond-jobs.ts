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
    console.log("Beyond Jobs service initialized with working sources:");
    console.log("- GitHub SimplifyJobs (Internships) ✅");
    console.log("- VolunteerConnector (Volunteer) ✅");
    if (this.coresignalApiKey) console.log("- CoreSignal (Internships) ✅");
    else console.log("- CoreSignal ❌ (API key missing - using GitHub only for internships)");
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

    const sources: Promise<BeyondJobsOpportunity[]>[] = [];

    // Internships - always include GitHub, add CoreSignal if available
    if (!params.type || params.type === 'all' || params.type === 'internship') {
      sources.push(this.fetchGitHubInternships());
      if (this.coresignalApiKey) {
        sources.push(this.fetchCoreSignalInternships(params));
      }
    }

    // Volunteer - VolunteerConnector has 968+ real opportunities
    if (!params.type || params.type === 'all' || params.type === 'volunteer') {
      sources.push(this.fetchVolunteerConnector(params));
    }

    const results = await Promise.allSettled(sources);
    results.forEach(r => {
      if (r.status === "fulfilled") opportunities.push(...r.value);
      else console.error("Source failed:", r.reason);
    });

    console.log(`Total opportunities fetched: ${opportunities.length}`);

    // Shuffle for diversity - ensures variety in results
    let shuffled = opportunities.sort(() => 0.5 - Math.random());

    // Apply filters
    if (params.type && params.type !== 'all') {
      shuffled = shuffled.filter(o => o.type === params.type);
    }
    if (params.remote !== undefined) {
      shuffled = shuffled.filter(o => o.remote === params.remote);
    }

    console.log(`After filtering: ${shuffled.length} opportunities (returning up to ${limit})`);
    return shuffled.slice(0, limit);
  }

  /** --- GitHub SimplifyJobs Internships --- */
  private async fetchGitHubInternships(): Promise<BeyondJobsOpportunity[]> {
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
        { headers: { 'User-Agent': 'Pathwise-BeyondJobs/1.0' } }
      );
      if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
      const data = await res.json();
      const listings = Array.isArray(data) ? data : [];
      
      // Filter for active internships
      const active = listings.filter((l: any) => l && l.active !== false);
      
      return active.map((l: any) => ({
        id: `github-${l.id || Math.random().toString(36).slice(2)}`,
        title: l.title || `${l.company_name} Internship`,
        organization: l.company_name || "Company",
        location: l.locations?.join(", ") || "Various",
        type: "internship" as const,
        duration: l.season || l.terms?.join(", ") || "Summer 2026",
        url: l.url || l.application_link || "#",
        description: this.cleanDescription(l.terms?.join(", ") || "Software engineering internship opportunity"),
        remote: l.locations?.some((loc: string) => loc.toLowerCase().includes("remote")) || false,
        source: "github"
      }));
    } catch (err: any) {
      console.error("GitHub internships error:", err.message);
      return [];
    }
  }

  /** --- CoreSignal Internships (Premium API) --- */
  private async fetchCoreSignalInternships(params: any): Promise<BeyondJobsOpportunity[]> {
    try {
      // Step 1: Search for job IDs using simple body format (like jobs.ts)
      const body: any = {
        title: params.keyword || "internship",
        application_active: true
      };
      if (params.location) body.location = params.location;

      const searchRes = await fetch(
        "https://api.coresignal.com/cdapi/v2/job_base/search/filter",
        {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "ApiKey": this.coresignalApiKey  // Capital K is critical
          },
          body: JSON.stringify(body)
        }
      );

      if (!searchRes.ok) {
        throw new Error(`CoreSignal search failed: ${searchRes.status}`);
      }

      const ids = await searchRes.json();
      const jobIds = Array.isArray(ids) ? ids.slice(0, 5) : [];

      if (jobIds.length === 0) {
        console.log("CoreSignal returned no job IDs for query:", body);
        return [];
      }

      console.log(`CoreSignal found ${jobIds.length} internship IDs, fetching details...`);

      // Step 2: Fetch full details for each job ID
      const details = await Promise.all(
        jobIds.map(async (id) => {
          const collectRes = await fetch(
            `https://api.coresignal.com/cdapi/v2/job_base/collect/${id}`,
            {
              headers: {
                "accept": "application/json",
                "ApiKey": this.coresignalApiKey
              }
            }
          );
          return collectRes.ok ? await collectRes.json() : null;
        })
      );

      const validJobs = details.filter(Boolean);
      console.log(`CoreSignal successfully fetched ${validJobs.length} internship details`);

      return validJobs.map((job: any) => ({
        id: `coresignal-${job.id}`,
        title: job.title || "Internship",
        organization: job.company_name || "Company",
        location: job.location || "Remote",
        type: "internship" as const,
        duration: job.employment_type || "Varies",
        url: job.url || "#",
        description: this.cleanDescription(job.description || ""),
        remote: job.remote_allowed || job.location?.toLowerCase().includes("remote") || false,
        source: "coresignal"
      }));
    } catch (err: any) {
      console.error("CoreSignal internships error:", err.message);
      return [];
    }
  }

  /** --- VolunteerConnector (Free API with 968+ opportunities) --- */
  private async fetchVolunteerConnector(params: any): Promise<BeyondJobsOpportunity[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params.keyword) searchParams.append("q", params.keyword);
      
      const res = await fetch(
        `https://www.volunteerconnector.org/api/search/?${searchParams}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (!res.ok) throw new Error(`VolunteerConnector returned ${res.status}`);
      
      const data = await res.json();
      const opportunities = data.results || [];
      
      console.log(`VolunteerConnector returned ${opportunities.length} volunteer opportunities`);
      
      return opportunities.slice(0, 10).map((opp: any) => ({
        id: `vol-${opp.id}`,
        title: opp.title || "Volunteer Opportunity",
        organization: opp.organization?.name || "Organization",
        location: opp.audience?.regions?.join(", ") || "Various",
        type: "volunteer" as const,
        duration: opp.dates || "Ongoing",
        url: opp.organization?.url || `https://www.volunteerconnector.org/opportunity/${opp.id}`,
        description: this.cleanDescription(opp.description || ""),
        remote: !!opp.remote_or_online,
        source: "volunteer-connector"
      }));
    } catch (err: any) {
      console.error("VolunteerConnector error:", err.message);
      return [];
    }
  }

  /** Utility: Clean HTML from descriptions */
  private cleanDescription(desc: string): string {
    if (!desc) return 'No description available';
    let cleaned = desc.replace(/<[^>]*>/g, '').trim();
    if (cleaned.length > 200) cleaned = cleaned.substring(0, 197) + '...';
    return cleaned || 'No description available';
  }

  /** AI-powered ranking using GPT */
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
      const rankings = JSON.parse(response).rankings;

      return opportunities.map((opp, index) => {
        const ranking = rankings.find((r: any) => r.opportunityIndex === index);
        return {
          ...opp,
          relevanceScore: ranking?.relevanceScore || 50,
          matchReason: ranking?.matchReason || 'Potentially relevant opportunity'
        };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error: any) {
      console.error('AI ranking error:', error.message);
      return opportunities.map(opp => ({
        ...opp,
        relevanceScore: 50,
        matchReason: 'Ranked by source diversity'
      }));
    }
  }
}

export const beyondJobsService = new BeyondJobsService();
