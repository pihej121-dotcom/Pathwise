// CREATE server/opportunities.ts

import type { InsertOpportunity, SelectOpportunity } from '../shared/schema';

interface OpportunitySource {
  name: string;
  category: string;
  fetchOpportunities(): Promise<InsertOpportunity[]>;
}

export class OpportunityRadarService {
  private sources: OpportunitySource[] = [];

  constructor() {
    this.initializeSources();
    console.log("Opportunity Radar initialized with multiple sources");
  }

  private initializeSources() {
    // Campus Research Source
    this.sources.push(new CampusResearchSource());
    
    // Startup Opportunities Source  
    this.sources.push(new StartupOpportunitiesSource());
    
    // Nonprofit Volunteer Source
    this.sources.push(new NonprofitVolunteerSource());
    
    // Student Organization Source
    this.sources.push(new StudentOrgSource());
  }

  async aggregateOpportunities(): Promise<InsertOpportunity[]> {
    console.log("Aggregating opportunities from all sources...");
    
    const allOpportunities: InsertOpportunity[] = [];
    
    // Fetch from all sources in parallel
    const sourcePromises = this.sources.map(async (source) => {
      try {
        console.log(`Fetching from ${source.name}...`);
        const opportunities = await source.fetchOpportunities();
        console.log(`${source.name} returned ${opportunities.length} opportunities`);
        return opportunities;
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(sourcePromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allOpportunities.push(...result.value);
      } else {
        console.error(`Source ${this.sources[index].name} failed:`, result.reason);
      }
    });

    console.log(`Total opportunities aggregated: ${allOpportunities.length}`);
    return this.deduplicateOpportunities(allOpportunities);
  }

  private deduplicateOpportunities(opportunities: InsertOpportunity[]): InsertOpportunity[] {
    const seen = new Set<string>();
    return opportunities.filter(opp => {
      const key = `${opp.title}-${opp.organization}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async searchOpportunities(params: {
    query?: string;
    category?: string;
    location?: string;
    compensation?: string;
    isRemote?: boolean;
    limit?: number;
  }): Promise<SelectOpportunity[]> {
    // This would typically query your database
    // For now, return fresh aggregated data filtered by params
    const opportunities = await this.aggregateOpportunities();
    
    let filtered = opportunities;

    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(query) ||
        opp.description.toLowerCase().includes(query) ||
        opp.organization.toLowerCase().includes(query)
      );
    }

    if (params.category) {
      filtered = filtered.filter(opp => opp.category === params.category);
    }

    if (params.location) {
      const location = params.location.toLowerCase();
      filtered = filtered.filter(opp => 
        opp.location?.toLowerCase().includes(location) || opp.isRemote
      );
    }

    if (params.compensation) {
      filtered = filtered.filter(opp => opp.compensation === params.compensation);
    }

    if (params.isRemote !== undefined) {
      filtered = filtered.filter(opp => opp.isRemote === params.isRemote);
    }

    return filtered.slice(0, params.limit || 50) as SelectOpportunity[];
  }
}

// Campus Research Opportunities Source
class CampusResearchSource implements OpportunitySource {
  name = "Campus Research";
  category = "research";

  async fetchOpportunities(): Promise<InsertOpportunity[]> {
    // Mock data - in reality you'd scrape university job boards
    return [
      {
        title: "Undergraduate Research Assistant - AI Lab",
        description: "Join our cutting-edge AI research lab working on natural language processing. Perfect for Computer Science students interested in machine learning.",
        organization: "University AI Research Lab",
        category: "research",
        location: "Campus",
        isRemote: false,
        compensation: "stipend",
        requirements: ["CS major", "Python experience", "GPA 3.5+"],
        skills: ["Python", "Machine Learning", "Research"],
        applicationUrl: "https://university.edu/research/apply",
        contactEmail: "ailab@university.edu",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        source: "campus",
        tags: ["AI", "Research", "Undergraduate"],
        estimatedHours: 10,
        duration: "semester"
      },
      {
        title: "Psychology Lab Research Volunteer",
        description: "Help conduct behavioral studies and data analysis. Great for Psychology majors looking to gain research experience.",
        organization: "Behavioral Psychology Department",
        category: "research", 
        location: "Campus",
        isRemote: false,
        compensation: "academic-credit",
        requirements: ["Psychology major", "Statistics course completed"],
        skills: ["SPSS", "Data Analysis", "Research Methods"],
        applicationUrl: "https://university.edu/psych/volunteer",
        contactEmail: "psych.lab@university.edu",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        source: "campus",
        tags: ["Psychology", "Research", "Volunteer"],
        estimatedHours: 8,
        duration: "semester"
      }
    ];
  }
}

// Startup Opportunities Source
class StartupOpportunitiesSource implements OpportunitySource {
  name = "Startup Opportunities";
  category = "startup";

  async fetchOpportunities(): Promise<InsertOpportunity[]> {
    // Mock data - in reality you'd use APIs like AngelList, Twitter, etc.
    return [
      {
        title: "Frontend Developer Intern - EdTech Startup",
        description: "Join a fast-growing EdTech startup building the future of online learning. Work directly with founders and gain equity experience.",
        organization: "LearnFast Technologies",
        category: "startup",
        location: "San Francisco, CA",
        isRemote: true,
        compensation: "paid",
        requirements: ["React experience", "Portfolio required", "Available 20+ hrs/week"],
        skills: ["React", "TypeScript", "UI/UX"],
        applicationUrl: "https://learnfast.com/careers",
        contactEmail: "hiring@learnfast.com",
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        source: "startup-scraper",
        tags: ["Frontend", "Startup", "Equity"],
        estimatedHours: 20,
        duration: "ongoing"
      },
      {
        title: "Hackathon Challenge - FinTech Innovation",
        description: "$10,000 prize pool for best FinTech solution. Winning teams get fast-track interviews with top FinTech companies.",
        organization: "FinTech Innovators Hackathon",
        category: "startup",
        location: "New York, NY",
        isRemote: false,
        compensation: "paid",
        requirements: ["Team of 2-4", "Prototype required", "College students only"],
        skills: ["Programming", "Business", "Presentation"],
        applicationUrl: "https://fintechhack.com/register",
        contactEmail: "team@fintechhack.com",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        source: "startup-scraper",
        tags: ["Hackathon", "FinTech", "Competition"],
        estimatedHours: 48,
        duration: "one-time"
      }
    ];
  }
}

// Nonprofit Volunteer Source  
class NonprofitVolunteerSource implements OpportunitySource {
  name = "Nonprofit Volunteers";
  category = "nonprofit";

  async fetchOpportunities(): Promise<InsertOpportunity[]> {
    // Mock data - in reality you'd use VolunteerMatch API, JustServe API, etc.
    return [
      {
        title: "Web Developer for Local Food Bank",
        description: "Help modernize our food bank's website and donation system. Make a real impact in fighting hunger while building your portfolio.",
        organization: "Community Food Bank",
        category: "nonprofit",
        location: "Local Community",
        isRemote: true,
        compensation: "unpaid",
        requirements: ["Web development skills", "Portfolio helpful", "Commitment of 3 months"],
        skills: ["HTML", "CSS", "JavaScript", "WordPress"],
        applicationUrl: "mailto:volunteer@foodbank.org",
        contactEmail: "volunteer@foodbank.org",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        source: "nonprofit-api",
        tags: ["Web Development", "Social Impact", "Portfolio"],
        estimatedHours: 5,
        duration: "ongoing"
      },
      {
        title: "Data Analyst for Environmental Nonprofit",
        description: "Analyze climate data and create visualizations for our environmental impact reports. Help save the planet with data!",
        organization: "Green Earth Initiative",
        category: "nonprofit",
        location: "Remote",
        isRemote: true,
        compensation: "unpaid",
        requirements: ["Statistics background", "Data visualization experience", "Environmental passion"],
        skills: ["Python", "R", "Tableau", "Data Analysis"],
        applicationUrl: "https://greenearthinitiative.org/volunteer",
        contactEmail: "data@greenearthinitiative.org",
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        source: "nonprofit-api", 
        tags: ["Data Science", "Environment", "Remote"],
        estimatedHours: 8,
        duration: "ongoing"
      }
    ];
  }
}

// Student Organization Source
class StudentOrgSource implements OpportunitySource {
  name = "Student Organizations";
  category = "student-org";

  async fetchOpportunities(): Promise<InsertOpportunity[]> {
    // Mock data - in reality this could be user-submitted or scraped from campus sites
    return [
      {
        title: "Marketing Director - Entrepreneurship Club",
        description: "Lead marketing efforts for our 500+ member entrepreneurship club. Plan events, manage social media, and build partnerships.",
        organization: "Student Entrepreneurship Club",
        category: "student-org",
        location: "Campus",
        isRemote: false,
        compensation: "unpaid",
        requirements: ["Marketing experience", "Leadership skills", "Available evenings"],
        skills: ["Marketing", "Social Media", "Event Planning"],
        applicationUrl: "https://studentorg.university.edu/eclub/apply",
        contactEmail: "leadership@eclub.university.edu",
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        source: "user-submitted",
        tags: ["Leadership", "Marketing", "Campus"],
        estimatedHours: 12,
        duration: "semester"
      },
      {
        title: "Tech Lead - Student App Development",
        description: "Lead a team of student developers building apps for campus life. Previous project had 2,000+ downloads!",
        organization: "Campus App Developers",
        category: "student-org",
        location: "Campus",
        isRemote: true,
        compensation: "unpaid",
        requirements: ["Mobile development experience", "Team leadership", "Previous project portfolio"],
        skills: ["React Native", "Leadership", "Mobile Development"],
        applicationUrl: "https://campusapps.university.edu/join",
        contactEmail: "techlead@campusapps.university.edu",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        source: "user-submitted",
        tags: ["Mobile Development", "Leadership", "Portfolio"],
        estimatedHours: 15,
        duration: "semester"
      }
    ];
  }
}
