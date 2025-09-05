interface CoreSignalJob {
  id: number;
  title: string;
  company_name: string;
  location: string;
  description: string;
  employment_type?: string;
  seniority?: string;
  time_posted?: string;
  remote_allowed?: boolean;
  salary_min?: number;
  salary_max?: number;
}

interface CoreSignalResponse {
  data: CoreSignalJob[];
  total_count: number;
}

export class JobsService {
  private coresignalApiKey = process.env.CORESIGNAL_API_KEY || "";
  private baseUrl = "https://api.coresignal.com/cdapi/v2";
  
  constructor() {
    if (!this.coresignalApiKey) {
      console.warn("CoreSignal API key not found. Job search will not work.");
    } else {
      console.log("CoreSignal API credentials loaded successfully");
    }
  }
  
  async searchJobs(params: {
    query?: string;
    location?: string;
    maxDistance?: number;
    resultsPerPage?: number;
    page?: number;
    salaryMin?: number;
    salaryMax?: number;
    contractType?: string;
  }): Promise<{ jobs: any[]; totalCount: number }> {
    try {
      if (!this.coresignalApiKey) {
        throw new Error("CoreSignal API key not configured");
      }

      const searchFilters: any = {};
      
      if (params.query) {
        searchFilters.title = params.query;
      }
      
      if (params.location) {
        searchFilters.location = params.location;
      }

      if (params.contractType) {
        searchFilters.employment_type = params.contractType;
      }

      console.log("CoreSignal search filters:", searchFilters);

      const response = await fetch(`${this.baseUrl}/job/search/filter`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apikey': this.coresignalApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(searchFilters)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("CoreSignal API error:", response.status, errorText);
        throw new Error(`CoreSignal API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("CoreSignal response:", data);
      
      // Transform CoreSignal data to match expected format
      const transformedJobs = (data || []).map((job: CoreSignalJob) => ({
        id: job.id.toString(),
        title: job.title || 'No Title',
        company: { display_name: job.company_name || 'Unknown Company' },
        location: { display_name: job.location || 'Unknown Location' },
        description: job.description || 'No description available',
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        contract_type: job.employment_type,
        created: job.time_posted || new Date().toISOString(),
        redirect_url: `https://coresignal.com/job/${job.id}`
      }));
      
      return {
        jobs: transformedJobs.slice(0, params.resultsPerPage || 20),
        totalCount: transformedJobs.length
      };
    } catch (error) {
      console.error("Job search error:", error);
      throw new Error("Failed to search jobs");
    }
  }

  async getJobDetails(jobId: string): Promise<AdzunaJob | null> {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/us/details/${jobId}`;
      const searchParams = new URLSearchParams({
        app_id: this.adzunaAppId,
        app_key: this.adzunaAppKey,
      });

      const response = await fetch(`${url}?${searchParams}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Adzuna API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Job details error:", error);
      throw new Error("Failed to get job details");
    }
  }

  async getSalaryStats(params: {
    title?: string;
    location?: string;
  }): Promise<{
    min: number;
    max: number;
    median: number;
  } | null> {
    try {
      const baseUrl = "https://api.adzuna.com/v1/api/jobs/us/salary";
      const searchParams = new URLSearchParams({
        app_id: this.adzunaAppId,
        app_key: this.adzunaAppKey,
      });

      if (params.title) {
        searchParams.append("what", params.title);
      }
      
      if (params.location) {
        searchParams.append("where", params.location);
      }

      const response = await fetch(`${baseUrl}?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Adzuna API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        min: data.min || 0,
        max: data.max || 0,
        median: data.median || 0
      };
    } catch (error) {
      console.error("Salary stats error:", error);
      return null;
    }
  }

  // Placeholder for future CoreSignal integration
  async searchCoreSignalJobs(params: any): Promise<any[]> {
    // TODO: Implement CoreSignal API integration
    console.log("CoreSignal integration not yet implemented");
    return [];
  }

  // Placeholder for future USAJobs integration
  async searchUSAJobs(params: any): Promise<any[]> {
    // TODO: Implement USAJobs API integration
    console.log("USAJobs integration not yet implemented");
    return [];
  }
}

export const jobsService = new JobsService();
