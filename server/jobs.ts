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
    
    console.log("Job matching system initialized with AI-powered skill extraction and compatibility scoring");
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
  }, userSkills?: string[]): Promise<{ jobs: any[]; totalCount: number }> {
    let jobs: any[] = [];
    let totalCount = 0;
    
    // ONLY USE CORESIGNAL - NO FALLBACKS
    if (!this.coresignalApiKey) {
      throw new Error("CoreSignal API key is required");
    }
    
    console.log("Attempting CoreSignal job search (ONLY source)...");
    try {
      const result = await this.searchWithCoreSignal(params);
      console.log(`CoreSignal returned ${result.jobs.length} jobs`);
      jobs = result.jobs;
      totalCount = result.totalCount;
    } catch (error: any) {
      console.error("CoreSignal API failed:", error.message);
      throw new Error(`CoreSignal API failed: ${error.message}`);
    }
    
    // Add compatibility scoring if user skills are provided
    if (userSkills && userSkills.length > 0) {
      jobs = jobs.map(job => ({
        ...job,
        compatibilityScore: this.calculateCompatibilityScore(job, userSkills, params)
      }));
      
      // Sort by compatibility score (highest first)
      jobs.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
    }
    
    return { jobs, totalCount };
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
    // CORRECT CoreSignal API endpoints from official docs
    const baseUrl = 'https://api.coresignal.com';
    const endpoints = [
      `${baseUrl}/cdapi/v2/job_base/search/filter`, // CORRECT v2 endpoint
      `${baseUrl}/cdapi/v2/job_base/search/es_dsl`   // Alternative Elasticsearch DSL endpoint
    ];
    
    // Build proper search body based on CoreSignal API docs
    // Filter search format - CORRECT field names from docs
    const filterSearchBody: any = {};
    
    if (params.query) {
      filterSearchBody.title = params.query; // "title" not "job_title"
    }
    
    if (params.location) {
      filterSearchBody.location = params.location; // "location" not "country"
    }

    if (params.contractType) {
      filterSearchBody.employment_type = params.contractType;
    }
    
    // Add active job filter
    filterSearchBody.application_active = true;
    
    // Alternative: Elasticsearch DSL format  
    const esSearchBody: any = {
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "application_active": true
              }
            }
          ]
        }
      },
      "size": Math.min(params.resultsPerPage || 20, 100),
      "from": ((params.page || 1) - 1) * (params.resultsPerPage || 20)
    };
    
    if (params.query) {
      esSearchBody.query.bool.must.push({
        "match": {
          "title": params.query  // Use "title" field as per docs
        }
      });
    }
    
    if (params.location) {
      esSearchBody.query.bool.must.push({
        "match": {
          "location": params.location // Use "location" field as per docs
        }
      });
    }

    console.log("CoreSignal API Key Present:", !!this.coresignalApiKey);
    
    // Try each endpoint with the correct body format
    const endpointBodies = [
      { endpoint: endpoints[0], body: filterSearchBody, type: 'filter' },
      { endpoint: endpoints[1], body: esSearchBody, type: 'es_dsl' }
    ];

    for (const { endpoint, body, type } of endpointBodies) {
      try {
        console.log(`\n=== Trying CoreSignal ${type} endpoint: ${endpoint} ===`);
        console.log(`${type} search body:`, JSON.stringify(body, null, 2));
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'ApiKey': this.coresignalApiKey, // CORRECT header name per docs
            'User-Agent': 'Pathwise-Jobs/1.0'
          },
          body: JSON.stringify(body)
        });
        
        console.log(`CoreSignal Response Status: ${response.status} ${response.statusText}`);
        console.log(`CoreSignal Response Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log(`\n*** CoreSignal SUCCESS with endpoint: ${endpoint} ***`);
          console.log("Full Response Keys:", Object.keys(data));
          console.log("Response Structure:", JSON.stringify(data, null, 2).substring(0, 500) + '...');
          
          // Handle different response structures that CoreSignal might return
          const jobsArray = data.data || data.results || data.jobs || data.items || [];
          console.log(`Raw jobs array length: ${Array.isArray(jobsArray) ? jobsArray.length : 'Not an array'}`);
          
          if (Array.isArray(jobsArray) && jobsArray.length > 0) {
            console.log("Sample job structure:", JSON.stringify(jobsArray[0], null, 2));
            
            const transformedJobs = jobsArray.map((job: any, index: number) => {
              console.log(`Transforming job ${index + 1}:`, {
                id: job.id,
                title: job.title || job.job_title,
                company: job.company_name || job.company
              });
              
              return {
                id: job.id?.toString() || `coresignal-${Date.now()}-${index}`,
                title: job.title || job.job_title || job.position || 'No Title Available',
                company: { 
                  display_name: job.company_name || job.company?.name || job.company || 'Unknown Company' 
                },
                location: { 
                  display_name: job.location || job.city || job.country || job.region || 'Location Not Specified' 
                },
                description: job.description || job.job_description || job.summary || 'No description available',
                salary_min: job.salary_min || job.salary?.min || null,
                salary_max: job.salary_max || job.salary?.max || null,
                contract_type: job.employment_type || job.job_type || job.type || 'Not specified',
                created: job.time_posted || job.created_at || job.posted_date || new Date().toISOString(),
                redirect_url: job.url || job.link || job.job_url || job.application_url || 
                  `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title || params.query || '')}`,
                source: 'CoreSignal API',
                requiredSkills: this.extractSkillsFromDescription(job.description || job.job_description || ''),
                niceToHaveSkills: []
              };
            });
            
            console.log(`Successfully transformed ${transformedJobs.length} CoreSignal jobs`);
            
            return {
              jobs: transformedJobs.slice(0, params.resultsPerPage || 20),
              totalCount: data.total_count || data.count || data.total || transformedJobs.length
            };
          } else {
            console.log("No jobs found in response or jobs is not an array:", typeof jobsArray, jobsArray);
            continue;
          }
        } else {
          const errorText = await response.text();
          console.log(`CoreSignal endpoint ${endpoint} failed:`);
          console.log(`Status: ${response.status}`);
          console.log(`Error body:`, errorText);
          continue;
        }
      } catch (error: any) {
        console.log(`CoreSignal endpoint ${endpoint} threw error:`, error.message);
        console.log(`Error stack:`, error.stack);
        continue;
      }
    }
    
    throw new Error(`CoreSignal API completely failed. Tried ${endpoints.length} endpoints. Check API key and endpoint URLs.`);
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
    // Try multiple countries as fallback
    const countries = ['gb', 'ca', 'au', 'us'];
    
    for (const country of countries) {
      try {
        const baseUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search`;
        const searchParams = new URLSearchParams({
          app_id: this.adzunaAppId,
          app_key: this.adzunaAppKey,
          results_per_page: (params.resultsPerPage || 15).toString(),
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

        console.log(`Trying Adzuna ${country.toUpperCase()}:`, `${baseUrl}?${searchParams}`);
        const response = await fetch(`${baseUrl}?${searchParams}`, {
          headers: {
            'User-Agent': 'Pathwise-Job-Matching/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data: AdzunaResponse = await response.json();
          console.log(`Adzuna ${country.toUpperCase()} success:`, data?.results?.length || 0, "jobs found");
          
          if (data.results && data.results.length > 0) {
            // Transform Adzuna data with proper structure and real URLs
            const transformedJobs = data.results.map((job: AdzunaJob) => ({
              id: job.id,
              title: job.title,
              company: { display_name: job.company.display_name || job.company },
              location: { display_name: job.location.display_name || job.location },
              description: job.description,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              contract_type: job.contract_type,
              created: job.created,
              redirect_url: job.redirect_url, // This is the REAL job application URL!
              source: `Adzuna ${country.toUpperCase()}`,
              requiredSkills: this.extractSkillsFromDescription(job.description || ''),
              niceToHaveSkills: []
            }));
            
            return {
              jobs: transformedJobs,
              totalCount: data.count || transformedJobs.length
            };
          }
        } else {
          console.log(`Adzuna ${country.toUpperCase()} failed:`, response.status);
        }
      } catch (error: any) {
        console.log(`Adzuna ${country.toUpperCase()} error:`, error.message);
        continue;
      }
    }
    
    throw new Error('All Adzuna country endpoints failed');
  }
  
  private generateSampleJobs(params: {
    query?: string;
    location?: string;
    resultsPerPage?: number;
  }): any[] {
    const query = params.query || 'Software Engineer';
    const location = params.location || 'United States';
    const limit = params.resultsPerPage || 20;
    
    const sampleJobTemplates = [
      {
        id: '1',
        title: `Senior ${query}`,
        company: { display_name: 'TechCorp Inc' },
        location: { display_name: location },
        description: `We are seeking an experienced ${query} to join our innovative team. You will work on cutting-edge projects using the latest technologies. Requirements include strong problem-solving skills, experience with modern development practices, and excellent communication abilities.`,
        salary_min: 80000,
        salary_max: 120000,
        contract_type: 'permanent',
        created: new Date().toISOString(),
        redirect_url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`,
        source: 'Generated (External APIs Unavailable)',
        requiredSkills: this.getRequiredSkillsForRole(query),
        niceToHaveSkills: this.getNiceToHaveSkillsForRole(query)
      },
      {
        id: '2',
        title: `${query} - Entry Level`,
        company: { display_name: 'StartupCo' },
        location: { display_name: location },
        description: `Join our growing team as a ${query}! Perfect opportunity for new graduates or career changers. We offer mentorship, training, and growth opportunities. Looking for candidates with basic knowledge in relevant technologies and eagerness to learn.`,
        salary_min: 60000,
        salary_max: 85000,
        contract_type: 'permanent',
        created: new Date(Date.now() - 86400000).toISOString(),
        redirect_url: `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}`,
        source: 'Generated (External APIs Unavailable)',
        requiredSkills: this.getRequiredSkillsForRole(query, 'entry'),
        niceToHaveSkills: this.getNiceToHaveSkillsForRole(query, 'entry')
      },
      {
        id: '3',
        title: `Lead ${query}`,
        company: { display_name: 'Enterprise Solutions LLC' },
        location: { display_name: location },
        description: `Leadership role for an experienced ${query}. You will lead a team of developers, architect solutions, and drive technical decisions. Requires 5+ years of experience, strong leadership skills, and deep technical expertise.`,
        salary_min: 120000,
        salary_max: 180000,
        contract_type: 'permanent',
        created: new Date(Date.now() - 172800000).toISOString(),
        redirect_url: `https://www.glassdoor.com/Jobs/${encodeURIComponent(query)}-jobs-SRCH_KO0,${query.length}.htm`,
        source: 'Generated (External APIs Unavailable)',
        requiredSkills: this.getRequiredSkillsForRole(query, 'senior'),
        niceToHaveSkills: this.getNiceToHaveSkillsForRole(query, 'senior')
      }
    ];
    
    // Generate more variations based on the query
    const variations = [];
    for (let i = 0; i < Math.min(limit, 15); i++) {
      const template = sampleJobTemplates[i % sampleJobTemplates.length];
      variations.push({
        ...template,
        id: (i + 1).toString(),
        title: template.title + (i > 2 ? ` (${Math.floor(i/3) + 1})` : ''),
        company: { display_name: template.company.display_name + (i > 2 ? ` ${Math.floor(i/3) + 1}` : '') }
      });
    }
    
    return variations;
  }
  
  private getRequiredSkillsForRole(role: string, level: string = 'mid'): string[] {
    const roleSkills: { [key: string]: { [level: string]: string[] } } = {
      'data science': {
        entry: ['Python', 'SQL', 'Statistics', 'Excel'],
        mid: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'NumPy', 'Statistics'],
        senior: ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'MLOps', 'Cloud Platforms', 'Leadership']
      },
      'software engineer': {
        entry: ['Programming', 'Git', 'Problem Solving', 'Basic Algorithms'],
        mid: ['JavaScript', 'React', 'Node.js', 'Databases', 'APIs', 'Testing'],
        senior: ['System Design', 'Microservices', 'Cloud Architecture', 'DevOps', 'Leadership', 'Mentoring']
      },
      'product manager': {
        entry: ['Communication', 'Analytics', 'User Research', 'Agile'],
        mid: ['Product Strategy', 'Data Analysis', 'A/B Testing', 'Stakeholder Management', 'Roadmapping'],
        senior: ['Strategic Planning', 'P&L Management', 'Team Leadership', 'Market Analysis', 'Go-to-Market']
      }
    };
    
    const normalizedRole = role.toLowerCase();
    for (const [key, levels] of Object.entries(roleSkills)) {
      if (normalizedRole.includes(key)) {
        return levels[level] || levels.mid;
      }
    }
    
    // Default skills for unknown roles
    return level === 'entry' 
      ? ['Communication', 'Problem Solving', 'Teamwork', 'Learning Ability']
      : level === 'senior'
      ? ['Leadership', 'Strategic Thinking', 'Project Management', 'Communication', 'Domain Expertise']
      : ['Problem Solving', 'Communication', 'Technical Skills', 'Collaboration'];
  }
  
  private getNiceToHaveSkillsForRole(role: string, level: string = 'mid'): string[] {
    const roleSkills: { [key: string]: { [level: string]: string[] } } = {
      'data science': {
        entry: ['R', 'Tableau', 'Power BI', 'Jupyter'],
        mid: ['R', 'Spark', 'Tableau', 'Docker', 'AWS', 'TensorFlow'],
        senior: ['Kubernetes', 'Airflow', 'Spark', 'Advanced Statistics', 'Business Strategy']
      },
      'software engineer': {
        entry: ['HTML/CSS', 'Command Line', 'IDEs', 'Basic Frameworks'],
        mid: ['TypeScript', 'Docker', 'AWS', 'GraphQL', 'MongoDB'],
        senior: ['Kubernetes', 'Terraform', 'System Design', 'Architecture Patterns']
      },
      'product manager': {
        entry: ['SQL', 'Figma', 'Jira', 'Basic Coding'],
        mid: ['SQL', 'Python', 'Figma', 'Customer Interviews', 'Metrics'],
        senior: ['Advanced Analytics', 'Business Intelligence', 'Technical Background']
      }
    };
    
    const normalizedRole = role.toLowerCase();
    for (const [key, levels] of Object.entries(roleSkills)) {
      if (normalizedRole.includes(key)) {
        return levels[level] || levels.mid;
      }
    }
    
    return ['Industry Knowledge', 'Certifications', 'Additional Languages', 'Tools Expertise'];
  }
  
  private calculateCompatibilityScore(job: any, userSkills: string[], params: any): number {
    let score = 0;
    const weights = {
      requiredSkills: 0.4,
      niceToHaveSkills: 0.2,
      titleMatch: 0.2,
      locationMatch: 0.1,
      experienceMatch: 0.1
    };
    
    // Required skills match (40% weight)
    const requiredSkills = job.requiredSkills || this.extractSkillsFromDescription(job.description);
    const requiredMatches = this.countSkillMatches(userSkills, requiredSkills);
    const requiredScore = requiredSkills.length > 0 ? (requiredMatches / requiredSkills.length) * 100 : 50;
    score += requiredScore * weights.requiredSkills;
    
    // Nice-to-have skills match (20% weight)
    const niceToHaveSkills = job.niceToHaveSkills || [];
    const niceToHaveMatches = this.countSkillMatches(userSkills, niceToHaveSkills);
    const niceToHaveScore = niceToHaveSkills.length > 0 ? (niceToHaveMatches / niceToHaveSkills.length) * 100 : 0;
    score += niceToHaveScore * weights.niceToHaveSkills;
    
    // Title match (20% weight)
    const titleScore = this.calculateTitleMatch(job.title, params.query || '');
    score += titleScore * weights.titleMatch;
    
    // Location match (10% weight)
    const locationScore = this.calculateLocationMatch(job.location?.display_name || '', params.location || '');
    score += locationScore * weights.locationMatch;
    
    // Experience level match (10% weight)
    const experienceScore = 75; // Default decent match
    score += experienceScore * weights.experienceMatch;
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }
  
  private extractSkillsFromDescription(description: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
      'TypeScript', 'Git', 'HTML', 'CSS', 'MongoDB', 'PostgreSQL', 'Machine Learning',
      'Data Science', 'TensorFlow', 'Pandas', 'NumPy', 'R', 'Tableau', 'Excel',
      'Leadership', 'Communication', 'Project Management', 'Agile', 'Scrum'
    ];
    
    return commonSkills.filter(skill => 
      description.toLowerCase().includes(skill.toLowerCase())
    );
  }
  
  private countSkillMatches(userSkills: string[], jobSkills: string[]): number {
    if (!userSkills || !jobSkills) return 0;
    
    return jobSkills.reduce((matches, jobSkill) => {
      const hasMatch = userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(userSkill.toLowerCase())
      );
      return matches + (hasMatch ? 1 : 0);
    }, 0);
  }
  
  private calculateTitleMatch(jobTitle: string, searchQuery: string): number {
    if (!searchQuery) return 50;
    
    const jobTitleLower = jobTitle.toLowerCase();
    const queryLower = searchQuery.toLowerCase();
    
    if (jobTitleLower.includes(queryLower)) return 100;
    if (queryLower.includes(jobTitleLower)) return 90;
    
    // Check for keyword overlaps
    const jobWords = jobTitleLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    const commonWords = jobWords.filter(word => queryWords.includes(word));
    
    return Math.min(100, (commonWords.length / Math.max(jobWords.length, queryWords.length)) * 100);
  }
  
  private calculateLocationMatch(jobLocation: string, searchLocation: string): number {
    if (!searchLocation) return 50;
    
    const jobLocationLower = jobLocation.toLowerCase();
    const searchLocationLower = searchLocation.toLowerCase();
    
    if (jobLocationLower.includes(searchLocationLower) || searchLocationLower.includes(jobLocationLower)) {
      return 100;
    }
    
    // Basic geographic matching
    if (jobLocationLower.includes('remote') || searchLocationLower.includes('remote')) {
      return 90;
    }
    
    return 30; // Default low match for different locations
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

  // AI-powered skill extraction using OpenAI
  async extractSkillsFromResume(resumeText: string): Promise<string[]> {
    try {
      const { aiService } = await import('./ai');
      
      const prompt = `Extract the technical and professional skills from this resume text. Return only a JSON array of skills, no additional text.
      
      Focus on:
      - Programming languages and frameworks
      - Tools and technologies 
      - Professional skills and certifications
      - Domain expertise
      
      Resume text:
      ${resumeText}
      
      Return format: ["skill1", "skill2", "skill3"]`;
      
      const response = await aiService.generateText(prompt);
      
      try {
        // Try to parse as JSON array
        const skills = JSON.parse(response.trim());
        return Array.isArray(skills) ? skills : [];
      } catch {
        // Fallback: extract skills from response text
        const skillMatches = response.match(/"([^"]+)"/g);
        return skillMatches ? skillMatches.map(s => s.replace(/"/g, '')) : [];
      }
    } catch (error: any) {
      console.error('Error extracting skills:', error);
      return [];
    }
  }
}

export const jobsService = new JobsService();
