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

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  created: string;
  redirect_url: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

export class JobsService {
  private coresignalApiKey = process.env.CORESIGNAL_API_KEY || "";
  private adzunaAppId = process.env.ADZUNA_APP_ID || "";
  private adzunaAppKey = process.env.ADZUNA_APP_KEY || "";
  private coresignalBaseUrl = "https://api.coresignal.com/cdapi/v2";
  
  constructor() {
    if (this.coresignalApiKey) {
      console.log("CoreSignal API credentials loaded successfully");
    } else {
      console.warn("CoreSignal API key not found.");
    }
    
    if (this.adzunaAppId && this.adzunaAppKey) {
      console.log("Adzuna API credentials loaded successfully (backup)");
    } else {
      console.warn("Adzuna API credentials not found for fallback.");
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
    // Try CoreSignal first
    if (this.coresignalApiKey) {
      try {
        console.log("Attempting CoreSignal job search...");
        const result = await this.searchWithCoreSignal(params);
        if (result.jobs.length > 0) {
          console.log(`CoreSignal returned ${result.jobs.length} jobs`);
          return result;
        }
        console.log("CoreSignal returned no jobs, falling back to Adzuna");
      } catch (error) {
        console.warn("CoreSignal failed:", error.message, "- falling back to Adzuna");
      }
    }
    
    // Fallback to Adzuna
    if (this.adzunaAppId && this.adzunaAppKey) {
      try {
        console.log("Using Adzuna as fallback...");
        const result = await this.searchWithAdzuna(params);
        console.log(`Adzuna returned ${result.jobs.length} jobs`);
        return result;
      } catch (error) {
        console.error("Adzuna fallback also failed:", error);
        throw new Error("Both CoreSignal and Adzuna failed");
      }
    }
    
    throw new Error("No API credentials configured for job search");
  }
  
  private async searchWithCoreSignal(params: {
    query?: string;
    location?: string;
    maxDistance?: number;
    resultsPerPage?: number;
    page?: number;
    salaryMin?: number;
    salaryMax?: number;
    contractType?: string;
  }): Promise<{ jobs: any[]; totalCount: number }> {
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

    const response = await fetch(`${this.coresignalBaseUrl}/job/search/filter`, {
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
      throw new Error(`CoreSignal API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("CoreSignal response sample:", data?.slice?.(0, 2) || data);
    
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
      redirect_url: `https://coresignal.com/job/${job.id}`,
      source: 'CoreSignal'
    }));
    
    return {
      jobs: transformedJobs.slice(0, params.resultsPerPage || 20),
      totalCount: transformedJobs.length
    };
  }
  
  private async searchWithAdzuna(params: {
    query?: string;
    location?: string;
    maxDistance?: number;
    resultsPerPage?: number;
    page?: number;
    salaryMin?: number;
    salaryMax?: number;
    contractType?: string;
  }): Promise<{ jobs: any[]; totalCount: number }> {
    const baseUrl = "https://api.adzuna.com/v1/api/jobs/us/search";
    const searchParams = new URLSearchParams({
      app_id: this.adzunaAppId,
      app_key: this.adzunaAppKey,
      results_per_page: (params.resultsPerPage || 20).toString(),
      page: (params.page || 1).toString(),
    });

    if (params.query) {
      searchParams.append("what", params.query);
    }
    
    if (params.location) {
      searchParams.append("where", params.location);
    }
    
    if (params.maxDistance) {
      searchParams.append("distance", params.maxDistance.toString());
    }
    
    if (params.salaryMin) {
      searchParams.append("salary_min", params.salaryMin.toString());
    }
    
    if (params.salaryMax) {
      searchParams.append("salary_max", params.salaryMax.toString());
    }
    
    if (params.contractType) {
      searchParams.append("contract_type", params.contractType);
    }

    const response = await fetch(`${baseUrl}?${searchParams}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Adzuna API error: ${response.status} - ${errorText}`);
    }

    const data: AdzunaResponse = await response.json();
    console.log("Adzuna response sample:", data?.results?.slice?.(0, 2) || "No results");
    
    // Transform Adzuna data and add source identifier
    const transformedJobs = (data.results || []).map((job: AdzunaJob) => ({
      ...job,
      source: 'Adzuna'
    }));
    
    return {
      jobs: transformedJobs,
      totalCount: data.count || 0
    };
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
