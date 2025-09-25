import { storage } from "./storage";
import { aiService } from "./ai";
import { openaiProjectService } from "./openai-service";
import type { 
  InsertSkillGapAnalysis, 
  InsertMicroProject, 
  MicroProject, 
  ProjectCompletion,
  SkillGapAnalysis,
  JobMatchAnalysis,
  Resume
} from "@shared/schema";

export interface DatasetResource {
  title: string;
  description: string;
  url: string;
  type: 'csv' | 'json' | 'api' | 'github' | 'kaggle';
  size?: string;
  license?: string;
}

export interface ProjectTemplate {
  title: string;
  description: string;
  templateUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  technologies: string[];
}

export class MicroProjectsService {
  private realDatasets: Map<string, DatasetResource[]> = new Map();
  private projectTemplates: Map<string, ProjectTemplate[]> = new Map();

  constructor() {
    this.initializeRealResources();
  }

  private initializeRealResources() {
    // Real datasets organized by skill category
    this.realDatasets.set('data-analysis', [
      {
        title: 'NYC Open Data - 311 Service Requests',
        description: 'Real NYC 311 service request data for analysis practice',
        url: 'https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9',
        type: 'csv',
        size: '~2GB',
        license: 'Public Domain'
      },
      {
        title: 'Kaggle - Customer Churn Dataset',
        description: 'Telecommunications customer churn data for predictive modeling',
        url: 'https://www.kaggle.com/datasets/blastchar/telco-customer-churn',
        type: 'csv',
        size: '950KB',
        license: 'CC0: Public Domain'
      },
      {
        title: 'World Bank Open Data API',
        description: 'Economic indicators and development data from World Bank',
        url: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392',
        type: 'api',
        license: 'CC BY 4.0'
      }
    ]);

    this.realDatasets.set('web-development', [
      {
        title: 'JSONPlaceholder API',
        description: 'Fake REST API for testing and prototyping',
        url: 'https://jsonplaceholder.typicode.com/',
        type: 'api',
        license: 'Open Source'
      },
      {
        title: 'Free Code Camp Weather API',
        description: 'Real weather data API for front-end projects',
        url: 'https://weather-proxy.freecodecamp.rocks/',
        type: 'api',
        license: 'Public'
      }
    ]);

    this.realDatasets.set('machine-learning', [
      {
        title: 'Iris Dataset',
        description: 'Classic dataset for classification problems',
        url: 'https://archive.ics.uci.edu/ml/datasets/iris',
        type: 'csv',
        size: '5KB',
        license: 'Public Domain'
      },
      {
        title: 'Boston Housing Dataset',
        description: 'Housing prices for regression analysis',
        url: 'https://www.kaggle.com/datasets/vikrishnan/boston-house-prices',
        type: 'csv',
        size: '25KB',
        license: 'Public Domain'
      }
    ]);

    // Project templates organized by skill category
    this.projectTemplates.set('web-development', [
      {
        title: 'React Dashboard Template',
        description: 'Modern dashboard with charts and data visualization',
        templateUrl: 'https://github.com/creativetimofficial/material-dashboard-react',
        difficulty: 'intermediate',
        technologies: ['React', 'Material-UI', 'Chart.js']
      },
      {
        title: 'Express REST API Starter',
        description: 'Clean REST API template with authentication',
        templateUrl: 'https://github.com/hagopj13/node-express-boilerplate',
        difficulty: 'beginner',
        technologies: ['Node.js', 'Express', 'MongoDB', 'JWT']
      }
    ]);

    this.projectTemplates.set('data-analysis', [
      {
        title: 'Jupyter Data Analysis Template',
        description: 'Complete data analysis workflow template',
        templateUrl: 'https://github.com/microsoft/Data-Science-For-Beginners/tree/main/4-Data-Science-Lifecycle',
        difficulty: 'beginner',
        technologies: ['Python', 'Pandas', 'Matplotlib', 'Jupyter']
      }
    ]);
  }

  async analyzeSkillGaps(
    userId: string, 
    resumeId?: string, 
    jobMatchId?: string,
    targetRole?: string
  ): Promise<SkillGapAnalysis> {
    try {
      let missingSkills: string[] = [];
      let skillCategories: string[] = [];
      let analysisSource = 'manual';
      
      if (jobMatchId) {
        // Get skill gaps from existing job match analysis
        const jobMatch = await storage.getJobMatchById(jobMatchId);
        if (jobMatch && jobMatch.skillsGaps) {
          missingSkills = jobMatch.skillsGaps;
          analysisSource = 'job-match';
        }
      } else if (resumeId) {
        // Get skill gaps from resume analysis
        const resume = await storage.getResumeById(resumeId);
        if (resume && resume.gaps) {
          // Extract missing skills from resume gaps
          const gaps = typeof resume.gaps === 'string' ? JSON.parse(resume.gaps) : resume.gaps;
          missingSkills = Array.isArray(gaps) ? 
            gaps.map(gap => gap.skill || gap.area).filter(Boolean) :
            [];
          analysisSource = 'resume-only';
        }
      }

      // If no existing gaps, generate them using AI
      if (missingSkills.length === 0 && targetRole) {
        missingSkills = await this.generateSkillGapsForRole(targetRole);
        analysisSource = 'ai-generated';
      }

      // Categorize skills
      skillCategories = this.categorizeSkills(missingSkills);

      // Create skill gap analysis record
      const skillGapData: InsertSkillGapAnalysis = {
        userId,
        resumeId,
        jobMatchId,
        targetRole,
        missingSkills,
        skillCategories,
        analysisSource,
        priorityLevel: 'high'
      };

      const analysisId = await storage.createSkillGapAnalysis(skillGapData);
      
      return {
        ...skillGapData,
        id: analysisId,
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      throw error;
    }
  }

  async generateMicroProjectsForSkillGaps(skillGapAnalysisId: string): Promise<MicroProject[]> {
    try {
      const analysis = await storage.getSkillGapAnalysisById(skillGapAnalysisId);
      if (!analysis) {
        throw new Error('Skill gap analysis not found');
      }

      const projects: MicroProject[] = [];
      
      // Generate 2-3 projects per missing skill (up to 10 total)
      const skillsToAddress = analysis.missingSkills.slice(0, 5); // Limit to top 5 skills
      
      for (const skill of skillsToAddress) {
        const skillProjects = await this.generateProjectsForSkill(skill);
        projects.push(...skillProjects);
      }

      // Store projects in database
      const createdProjects = await Promise.all(
        projects.map(project => this.storeProject(project))
      );

      return createdProjects;

    } catch (error) {
      console.error('Error generating micro-projects:', error);
      throw error;
    }
  }

  private async generateSkillGapsForRole(targetRole: string): Promise<string[]> {
    try {
      const prompt = `For a ${targetRole} role, what are the 5 most important technical skills that candidates often lack? 
      
      Return only a JSON array of skill names, no additional text.
      Focus on concrete, learnable skills that can be practiced through hands-on projects.
      
      Example format: ["Python", "SQL", "Data Visualization", "API Development", "Version Control"]`;

      const response = await aiService.generateText(prompt);
      
      try {
        return JSON.parse(response.trim());
      } catch {
        // Fallback parsing
        const skills = response.match(/"([^"]+)"/g);
        return skills ? skills.map(s => s.replace(/"/g, '')) : ['Programming', 'Problem Solving'];
      }
    } catch (error) {
      console.error('Error generating skill gaps:', error);
      return ['Programming', 'Problem Solving']; // Fallback
    }
  }

  private categorizeSkills(skills: string[]): string[] {
    const categories = new Set<string>();
    
    for (const skill of skills) {
      const skillLower = skill.toLowerCase();
      
      // Technical skills
      if (skillLower.match(/programming|python|javascript|java|sql|react|node|html|css|git|api|database/)) {
        categories.add('technical');
      }
      // Data skills  
      else if (skillLower.match(/data|analysis|visualization|statistics|excel|tableau|pandas/)) {
        categories.add('data-analysis');
      }
      // Design skills
      else if (skillLower.match(/design|ui|ux|figma|photoshop|branding/)) {
        categories.add('design');
      }
      // Soft skills
      else if (skillLower.match(/communication|leadership|management|teamwork|presentation/)) {
        categories.add('soft-skills');
      }
      // Default to technical
      else {
        categories.add('technical');
      }
    }
    
    return Array.from(categories);
  }

  private async generateProjectsForSkill(skill: string): Promise<InsertMicroProject[]> {
    try {
      const skillCategory = this.getSkillCategory(skill);
      const datasets = this.realDatasets.get(skillCategory) || [];
      const templates = this.projectTemplates.get(skillCategory) || [];

      const prompt = `Create a micro-project to help someone learn ${skill}. This should be a practical, hands-on project that can be completed in 2-4 hours.

      Project Requirements:
      - Must use real data or resources (not fake/mock data)
      - Should produce a portfolio-ready artifact 
      - Include step-by-step instructions
      - Specify clear deliverables and evaluation criteria
      - Appropriate for someone new to ${skill}

      Available real resources:
      ${datasets.map(d => `- ${d.title}: ${d.url}`).join('\n')}
      ${templates.map(t => `- ${t.title}: ${t.templateUrl}`).join('\n')}

      Return a JSON object with this structure:
      {
        "title": "Project title (50 chars max)",
        "description": "What the student will build and learn",
        "instructions": {
          "overview": "Brief project overview",
          "steps": ["Step 1", "Step 2", "Step 3", "..."],
          "resources": ["Resource 1", "Resource 2", "..."]
        },
        "deliverables": ["Deliverable 1", "Deliverable 2", "..."],
        "evaluationCriteria": ["Criterion 1", "Criterion 2", "..."],
        "estimatedHours": 2-4,
        "datasetUrl": "URL to real dataset if applicable",
        "templateUrl": "URL to starter template if applicable"
      }`;

      const response = await aiService.generateText(prompt);
      
      try {
        const projectData = JSON.parse(response);
        
        return [{
          title: projectData.title || `${skill} Practice Project`,
          description: projectData.description || `Build practical skills in ${skill}`,
          targetSkill: skill,
          skillCategory,
          difficultyLevel: 'beginner',
          estimatedHours: projectData.estimatedHours || 3,
          projectType: this.getProjectType(skillCategory),
          instructions: projectData.instructions,
          deliverables: projectData.deliverables || ['Completed project', 'Reflection writeup'],
          evaluationCriteria: projectData.evaluationCriteria || ['Functionality', 'Code quality', 'Documentation'],
          datasetUrl: projectData.datasetUrl,
          templateUrl: projectData.templateUrl,
          repositoryUrl: templates[0]?.templateUrl,
          tags: [skill.toLowerCase().replace(' ', '-'), skillCategory],
          isActive: true
        }];

      } catch (parseError) {
        console.error('Error parsing project JSON:', parseError);
        return this.generateFallbackProject(skill, skillCategory);
      }

    } catch (error) {
      console.error(`Error generating project for ${skill}:`, error);
      return this.generateFallbackProject(skill, 'technical');
    }
  }

  private generateFallbackProject(skill: string, category: string): InsertMicroProject[] {
    const datasets = this.realDatasets.get(category) || [];
    const fallbackDataset = datasets[0];

    return [{
      title: `${skill} Hands-On Project`,
      description: `Build practical experience with ${skill} through a real-world project using authentic data and tools.`,
      targetSkill: skill,
      skillCategory: category,
      difficultyLevel: 'beginner',
      estimatedHours: 3,
      projectType: this.getProjectType(category),
      instructions: {
        overview: `Learn ${skill} by working with real data and building something tangible.`,
        steps: [
          'Set up your development environment',
          'Explore the provided dataset/resources',
          'Follow the tutorial to build your solution',
          'Test and document your work',
          'Create a portfolio writeup'
        ],
        resources: fallbackDataset ? [fallbackDataset.url] : []
      },
      deliverables: ['Working solution', 'Portfolio documentation', 'Code repository'],
      evaluationCriteria: ['Completeness', 'Functionality', 'Documentation quality'],
      datasetUrl: fallbackDataset?.url,
      tags: [skill.toLowerCase().replace(' ', '-'), category],
      isActive: true
    }];
  }

  private getSkillCategory(skill: string): string {
    const skillLower = skill.toLowerCase();
    
    if (skillLower.match(/data|analysis|visualization|statistics|excel|tableau|pandas/)) {
      return 'data-analysis';
    } else if (skillLower.match(/react|node|javascript|html|css|web|frontend|backend/)) {
      return 'web-development';
    } else if (skillLower.match(/machine learning|ml|ai|tensorflow|python.*analysis/)) {
      return 'machine-learning';
    } else {
      return 'technical';
    }
  }

  private getProjectType(category: string): string {
    switch (category) {
      case 'data-analysis': return 'data-analysis';
      case 'web-development': return 'coding';
      case 'machine-learning': return 'coding';
      case 'design': return 'design';
      default: return 'coding';
    }
  }

  private async storeProject(projectData: InsertMicroProject): Promise<MicroProject> {
    const projectId = await storage.createMicroProject(projectData);
    return {
      ...projectData,
      id: projectId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // User interaction methods
  async getRecommendedProjectsForUser(userId: string): Promise<MicroProject[]> {
    try {
      // Get user's skill gaps
      const skillGaps = await storage.getSkillGapAnalysesByUser(userId);
      if (skillGaps.length === 0) {
        return [];
      }

      const latestAnalysis = skillGaps[0]; // Most recent analysis
      
      // Get projects for the missing skills
      const projects = await storage.getMicroProjectsBySkills(latestAnalysis.missingSkills);
      
      // Filter out already completed projects
      const completions = await storage.getProjectCompletionsByUser(userId);
      const completedProjectIds = new Set(completions.map(c => c.projectId));
      
      return projects.filter(p => !completedProjectIds.has(p.id));

    } catch (error) {
      console.error('Error getting recommended projects:', error);
      return [];
    }
  }

  async startProject(userId: string, projectId: string): Promise<void> {
    try {
      await storage.createProjectCompletion({
        userId,
        projectId,
        status: 'in_progress',
        progressPercentage: 0,
        startedAt: new Date()
      });
    } catch (error) {
      console.error('Error starting project:', error);
      throw error;
    }
  }

  async updateProjectProgress(
    userId: string, 
    projectId: string, 
    progressPercentage: number,
    timeSpent?: number
  ): Promise<void> {
    try {
      const completion = await storage.getProjectCompletion(userId, projectId);
      if (!completion) {
        throw new Error('Project completion not found');
      }

      await storage.updateProjectCompletion(completion.id, {
        progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
        timeSpent: timeSpent || completion.timeSpent,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating project progress:', error);
      throw error;
    }
  }

  async completeProject(
    userId: string,
    projectId: string,
    artifactUrls: string[],
    reflectionNotes?: string,
    selfAssessment?: number
  ): Promise<void> {
    try {
      const completion = await storage.getProjectCompletion(userId, projectId);
      if (!completion) {
        throw new Error('Project completion not found');
      }

      await storage.updateProjectCompletion(completion.id, {
        status: 'completed',
        progressPercentage: 100,
        completedAt: new Date(),
        artifactUrls,
        reflectionNotes,
        selfAssessment,
        updatedAt: new Date()
      });

      // Create portfolio artifacts
      if (artifactUrls.length > 0) {
        const project = await storage.getMicroProjectById(projectId);
        if (project) {
          await storage.createPortfolioArtifact({
            userId,
            completionId: completion.id,
            title: `${project.title} - Portfolio`,
            description: project.description,
            artifactType: project.projectType,
            fileUrl: artifactUrls[0],
            skillsDemonstrated: [project.targetSkill],
            tags: project.tags || [],
            isPublic: false,
            isFeatured: false
          });
        }
      }
    } catch (error) {
      console.error('Error completing project:', error);
      throw error;
    }
  }

  // AI-Powered Project Generation Methods
  async generateAIPoweredProjects(userId: string): Promise<MicroProject[]> {
    try {
      // Get user's latest skill gap analysis and resume
      const skillGaps = await storage.getSkillGapAnalysesByUser(userId);
      if (skillGaps.length === 0) {
        console.log('No skill gap analyses found for user:', userId);
        return [];
      }

      const latestAnalysis = skillGaps[0];
      console.log('Found skill gaps:', latestAnalysis.missingSkills);
      
      if (!latestAnalysis.missingSkills || latestAnalysis.missingSkills.length === 0) {
        console.log('Missing skills array is empty for user:', userId);
        return [];
      }
      const resume = await storage.getResumeById(latestAnalysis.resumeId || '');
      
      const userBackground = this.extractUserBackground(resume);
      const targetRole = latestAnalysis.targetRole || 'Product Manager';

      // Generate one AI project for the most critical skill gap
      const topSkill = latestAnalysis.missingSkills[0]; // Take the first/most important skill
      
      const projectRequest = {
        skillGap: topSkill,
        skillCategory: this.getSkillCategory(topSkill),
        userBackground: userBackground,
        targetRole: targetRole,
        difficultyLevel: this.getDifficultyForSkill(topSkill) as 'beginner' | 'intermediate' | 'advanced'
      };

      console.log('Generating AI-powered project for skill:', topSkill);
      console.log('Project request details:', projectRequest);
      
      let generatedProject;
      try {
        generatedProject = await openaiProjectService.generateDetailedProject(projectRequest);
      } catch (error) {
        console.log('AI generation failed, using fallback project');
        // Create fallback project directly and store it
        const fallbackProject = {
          title: `${topSkill} Skills Practice`,
          description: `Learn ${topSkill} through hands-on exercises and real-world scenarios.`,
          targetSkill: topSkill,
          skillCategory: projectRequest.skillCategory,
          difficultyLevel: projectRequest.difficultyLevel,
          estimatedHours: 10,
          projectType: 'practice' as const,
          instructions: [`Complete exercises in ${topSkill}`, 'Practice with real scenarios', 'Create portfolio deliverables'],
          deliverables: [`${topSkill} project report`, 'Portfolio examples'],
          evaluationCriteria: ['Quality of deliverables', 'Skill demonstration'],
          exampleArtifacts: ['Project documentation'],
          datasetUrl: null,
          templateUrl: null,
          repositoryUrl: null,
          tutorialUrl: null,
          portfolioTemplate: null,
          tags: [topSkill.toLowerCase()],
          isActive: true
        };
        
        const projectId = await storage.createMicroProject(fallbackProject);
        return [{
          ...fallbackProject,
          id: projectId,
          createdAt: new Date(),
          updatedAt: new Date()
        }];
      }
      console.log('Successfully generated project:', generatedProject.title);
      const generatedProjects = [generatedProject];
      
      // Store the generated projects
      const storedProjects = await Promise.all(
        generatedProjects.map(async (projectData) => {
          const projectId = await storage.createMicroProject(projectData);
          return {
            ...projectData,
            id: projectId,
            createdAt: new Date(),
            updatedAt: new Date()
          } as MicroProject;
        })
      );

      console.log(`Successfully generated ${storedProjects.length} AI-powered projects`);
      return storedProjects;

    } catch (error) {
      console.error('Error generating AI-powered projects:', error);
      return [];
    }
  }


  private extractUserBackground(resume: any): string {
    if (!resume || !resume.extractedText) {
      return 'Professional with technical background';
    }

    const text = resume.extractedText.toLowerCase();
    
    if (text.includes('data scientist') || text.includes('machine learning')) {
      return 'Data Scientist';
    } else if (text.includes('software engineer') || text.includes('developer')) {
      return 'Software Engineer';
    } else if (text.includes('analyst') || text.includes('analytics')) {
      return 'Data Analyst';
    } else if (text.includes('researcher')) {
      return 'Researcher';
    } else {
      return 'Professional with technical background';
    }
  }

  private getDifficultyForSkill(skill: string): string {
    const skillLower = skill.toLowerCase();
    
    // Advanced skills typically require deep strategic thinking
    if (skillLower.includes('strategy') || skillLower.includes('leadership') || skillLower.includes('go-to-market')) {
      return 'advanced';
    }
    
    // Intermediate skills require some foundational knowledge
    if (skillLower.includes('product management') || skillLower.includes('agile') || skillLower.includes('scrum')) {
      return 'intermediate';  
    }
    
    // Default to intermediate for most career transition skills
    return 'intermediate';
  }
}

export const microProjectsService = new MicroProjectsService();