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
  private adzunaAppId = process.env.ADZUNA_APP_ID || process.env.ADZUNA_APP_ID_ENV_VAR || "";
  private adzunaAppKey = process.env.ADZUNA_APP_KEY || process.env.ADZUNA_APP_KEY_ENV_VAR || "";
  
  async searchJobs(params: {
    query?: string;
    location?: string;
    maxDistance?: number;
    resultsPerPage?: number;
    page?: number;
    salaryMin?: number;
    salaryMax?: number;
    contractType?: string;
  }): Promise<{ jobs: AdzunaJob[]; totalCount: number }> {
    try {
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
        throw new Error(`Adzuna API error: ${response.status}`);
      }

      const data: AdzunaResponse = await response.json();
      
      return {
        jobs: data.results || [],
        totalCount: data.count || 0
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
