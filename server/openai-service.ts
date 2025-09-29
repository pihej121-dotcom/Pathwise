import OpenAI from "openai";
import type { InsertMicroProject } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025.
// do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProjectGenerationRequest {
  skillGap: string;
  skillCategory: string;
  userBackground: string;
  targetRole: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export class OpenAIProjectService {
  // ▼ Flexible category → project type
  private getProjectType(category: string): string {
    const normalized = category.toLowerCase().trim();
    
    const typeMappings = [
      { pattern: /data\s*(science|analysis)|analytics/, type: 'data-analysis' },
      { pattern: /web\s*dev|frontend|backend|software|programming|coding/, type: 'coding' },
      { pattern: /machine\s*learning|ml|ai|artificial\s*intelligence/, type: 'ai-development' },
      { pattern: /nursing|healthcare|medical|patient\s*care|clinical/, type: 'clinical-practice' },
      { pattern: /teach|educat|pedagogy|lesson\s*plan|curriculum/, type: 'education' },
      { pattern: /business|management|admin|leadership/, type: 'business' },
      { pattern: /design|art|creative|ui|ux|graphic/, type: 'creative' },
      { pattern: /research|academic|writing|communication/, type: 'research' },
      { pattern: /teamwork|collab|presentation|public\s*speaking/, type: 'soft-skills' }
    ];

    for (const mapping of typeMappings) {
      if (mapping.pattern.test(normalized)) return mapping.type;
    }

    if (normalized.includes('+') || normalized.includes('and')) {
      const parts = normalized.split(/[+and]/).map(part => part.trim());
      const types = parts.map(part => this.getProjectType(part));
      return types.includes('coding') ? 'coding' : types[0] || 'general';
    }

    if (normalized.length <= 3) return 'general';
    if (normalized.endsWith('ing')) return normalized.slice(0, -3);
    return normalized.includes('-') ? normalized : 'general-skills';
  }

  // ▼ Updated with structured micro-internship schema
  async generateDetailedProject(
    request: ProjectGenerationRequest
  ): Promise<Omit<InsertMicroProject, 'id' | 'createdAt' | 'updatedAt'>> {
    const prompt = `Create a detailed micro-internship project for a ${request.userBackground} transitioning to ${request.targetRole}. 
Focus on developing "${request.skillGap}" skills at ${request.difficultyLevel} level.

Required format (MUST include all sections):

{
  "title": "Project title",
  "description": "1-paragraph overview of learning objectives",
  "targetSkill": "${request.skillGap}",
  "skillCategory": "${request.skillCategory}",
  "estimatedHours": 2-20,
  "instructions": {
    "learningOutcomes": [
      "Clear measurable skill the user will gain",
      "Another specific competency"
    ],
    "weeklyStructure": [
      {
        "week": 1,
        "theme": "Skill foundation",
        "topics": ["Topic 1", "Topic 2"],
        "activities": [
          {
            "name": "Activity title",
            "purpose": "Why this matters",
            "steps": ["Step 1", "Step 2"],
            "resources": ["Resource 1 URL", "Resource 2 URL"],
            "timeCommitment": "X hours",
            "deliverable": "Concrete output expected"
          }
        ]
      }
    ],
    "assessment": {
      "milestones": ["Week 1 Checkpoint", "Midpoint Review"],
      "finalDeliverable": "Portfolio-ready artifact",
      "evaluationRubric": [
        {"criteria": "Technical Quality", "benchmarks": ["Poor", "Good", "Excellent"]},
        {"criteria": "Professionalism", "benchmarks": ["Basic", "Proficient", "Exceptional"]}
      ]
    }
  },
  "resources": {
    "readings": ["Title - URL"],
    "tools": ["Software/tools needed"],
    "templates": ["Template URL"]
  }
}

Guidelines:
1. Structure as a 2-4 week micro-internship
2. Include real-world tools/data where possible
3. Make deliverables portfolio-ready
4. Focus on ${request.difficultyLevel}-level complexity
5. Return ONLY valid JSON`;

    try {
      console.log('Starting OpenAI request for project generation...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Return ONLY valid JSON with no markdown formatting or extra text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1800
      }, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('OpenAI response received successfully');
      
      let content = response.choices[0].message.content || '{}';
      console.log('Raw OpenAI response:', content.length > 200 ? 
        `${content.substring(0, 200)}...` : content);
      
      // JSON cleanup
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error('Invalid JSON response - missing boundaries');
      }
      
      content = content
        .slice(jsonStart, jsonEnd + 1)
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      if (content.startsWith('json\n')) {
        content = content.substring(5);
      }
      
      let projectData;
      try {
        projectData = JSON.parse(content);

        // Normalize possible key drift
        if (!projectData.title && projectData.projectTitle) {
          projectData.title = projectData.projectTitle;
        }
        if (!projectData.difficultyLevel && projectData.difficulty) {
          projectData.difficultyLevel = projectData.difficulty;
        }
        if (!projectData.skillCategory && projectData.category) {
          projectData.skillCategory = projectData.category;
        }

        if (!projectData.title || typeof projectData.title !== 'string') {
          throw new Error('Missing or invalid title in response');
        }
      } catch (parseError) {
        console.error('JSON parse failed, falling back:', parseError);

        // Minimal fallback project
        projectData = {
          title: `${request.skillGap} Practice Project`,
          description: `Develop ${request.skillGap} skills through hands-on exercises`,
          targetSkill: request.skillGap,
          skillCategory: request.skillCategory,
          estimatedHours: 10,
          instructions: {
            learningOutcomes: [
              `Gain practical ${request.skillGap} skills`,
              `Apply ${request.skillGap} to ${request.targetRole} context`
            ],
            weeklyStructure: [],
            assessment: {
              milestones: ["Checkpoint"],
              finalDeliverable: `Portfolio-ready ${request.skillGap} project`,
              evaluationRubric: []
            }
          },
          resources: {
            readings: [],
            tools: [],
            templates: []
          }
        };
      }
      
      return {
        title: projectData.title,
        description: projectData.description,
        targetSkill: projectData.targetSkill || request.skillGap,
        skillCategory: projectData.skillCategory || request.skillCategory,
        difficultyLevel: projectData.difficultyLevel || request.difficultyLevel,
        estimatedHours: projectData.estimatedHours || 12,
        projectType: projectData.projectType || this.getProjectType(request.skillCategory),
        instructions: projectData.instructions,
        deliverables: projectData.deliverables || [],
        evaluationCriteria: projectData.evaluationCriteria || [],
        exampleArtifacts: projectData.exampleArtifacts || [],
        datasetUrl: null,
        tags: projectData.tags || [request.skillGap.toLowerCase()],
        isActive: true
      };
    } catch (error) {
      console.error("Error generating project with OpenAI:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenAI request timed out after 45 seconds');
      }
      throw new Error(`Failed to generate AI-powered project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateMultipleProjects(
    requests: ProjectGenerationRequest[]
  ): Promise<Omit<InsertMicroProject, 'id' | 'createdAt' | 'updatedAt'>[]> {
    const projects = await Promise.allSettled(
      requests.map(request => this.generateDetailedProject(request))
    );

    return projects
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<Omit<InsertMicroProject, 'id' | 'createdAt' | 'updatedAt'>>).value);
  }

  async enhanceExistingProject(
    projectTitle: string,
    currentInstructions: any
  ): Promise<any> {
    const prompt = `Enhance the following micro-internship project with more detail and weekly structure:

Project Title: ${projectTitle}
Current Instructions: ${JSON.stringify(currentInstructions, null, 2)}

Add:
1. Weekly themes and activities
2. Clear learning outcomes
3. Assessment checkpoints and rubric
4. Real-world tools/resources
5. Portfolio-ready deliverables

Return enhanced JSON in the same schema.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert instructional designer. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Error enhancing project instructions:", error);
      return currentInstructions;
    }
  }
}

export const openaiProjectService = new OpenAIProjectService();

