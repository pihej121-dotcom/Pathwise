import OpenAI from "openai";
import type { InsertMicroProject } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProjectGenerationRequest {
  skillGap: string;
  skillCategory: string;
  userBackground: string;
  targetRole: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export class OpenAIProjectService {
  async generateDetailedProject(request: ProjectGenerationRequest): Promise<Omit<InsertMicroProject, 'id' | 'createdAt' | 'updatedAt'>> {
    const prompt = `You are an expert career coach. The user is a ${request.userBackground} who wants to become a ${request.targetRole}. Their resume analysis shows they lack "${request.skillGap}" skills.

Create a detailed practice project with specific exercises that will help them demonstrate this skill on their resume. Focus on:
- Concrete, actionable steps they can complete 
- Real deliverables they can add to their portfolio
- Specific scenarios relevant to ${request.targetRole} role
- Measurable outcomes they can quantify on their resume

JSON format:
{
  "title": "string",
  "description": "string", 
  "targetSkill": "string",
  "skillCategory": "string",
  "difficulty": "${request.difficultyLevel}",
  "estimatedHours": number,
  "projectType": "design|development|research|analysis",
  "instructions": {
    "overview": "string",
    "prerequisites": ["string"],
    "detailed_steps": [
      {
        "step": number,
        "title": "string",
        "duration": "string", 
        "description": "string",
        "tasks": ["string"],
        "resources": ["string"],
        "deliverable": "string"
      }
    ],
    "success_criteria": ["string"],
    "resources": [
      {
        "title": "string",
        "url": "string",
        "type": "string",
        "description": "string"
      }
    ]
  },
  "deliverables": ["string"],
  "evaluationCriteria": ["string"],
  "exampleArtifacts": ["string"],
  "tags": ["string"]
}`;

    try {
      console.log('Starting OpenAI request for project generation...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
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
        max_tokens: 1000
      }, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('OpenAI response received successfully');
      
      let content = response.choices[0].message.content || '{}';
      console.log('Raw OpenAI response:', content.substring(0, 200) + '...');
      
      // Clean up common JSON formatting issues
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Find the JSON object boundaries
      const start = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (start >= 0 && lastBrace > start) {
        content = content.slice(start, lastBrace + 1);
      }
      
      let projectData;
      try {
        projectData = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parse failed, creating fallback structure');
        projectData = {
          title: `${request.skillGap} Resume Builder Project`,
          description: `Step-by-step exercises to demonstrate ${request.skillGap} skills for ${request.targetRole} role`,
          targetSkill: request.skillGap,
          difficulty: request.difficultyLevel,
          estimatedHours: 12,
          instructions: [
            `Exercise 1: Research and analyze 3 real ${request.targetRole} job postings for ${request.skillGap} requirements`,
            `Exercise 2: Create a practical ${request.skillGap} deliverable using real data/scenarios`,
            `Exercise 3: Document your process and quantify the impact/results`,
            `Exercise 4: Build portfolio examples that demonstrate ${request.skillGap} competency`
          ],
          deliverables: [
            `${request.skillGap} analysis report with specific metrics`,
            `Portfolio-ready project showcasing ${request.skillGap} skills`,
            `Resume bullet points with quantified achievements`
          ],
          evaluationCriteria: [
            "Demonstrates practical application of skills",
            "Shows measurable impact and results", 
            "Creates portfolio-worthy deliverables"
          ],
          tags: [request.skillGap.toLowerCase(), "resume building", "portfolio"]
        };
      }
      
      return {
        title: projectData.title,
        description: projectData.description,
        targetSkill: projectData.targetSkill || request.skillGap,
        skillCategory: projectData.skillCategory || request.skillCategory,
        difficultyLevel: projectData.difficulty || request.difficultyLevel,
        estimatedHours: projectData.estimatedHours || 12,
        projectType: projectData.projectType || 'design',
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

  async generateMultipleProjects(requests: ProjectGenerationRequest[]): Promise<Omit<InsertMicroProject, 'id' | 'createdAt' | 'updatedAt'>[]> {
    const projects = await Promise.allSettled(
      requests.map(request => this.generateDetailedProject(request))
    );

    return projects
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<Omit<InsertMicroProject, 'id' | 'createdAt' | 'updatedAt'>>).value);
  }

  async enhanceExistingProject(projectTitle: string, currentInstructions: any): Promise<any> {
    const prompt = `Enhance the following micro-internship project with more detailed, step-by-step instructions:

Project Title: ${projectTitle}
Current Instructions: ${JSON.stringify(currentInstructions, null, 2)}

Make the instructions more comprehensive by:
1. Adding specific tools and resources to use
2. Including templates and examples
3. Providing step-by-step tasks with time estimates
4. Adding success criteria and evaluation methods
5. Including real-world resources and links

Respond with enhanced instructions JSON in the same format, but with much more detail and actionable guidance.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert instructional designer who creates detailed, actionable project instructions. Enhance existing project instructions to be comprehensive and immediately actionable."
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
      return currentInstructions; // Return original if enhancement fails
    }
  }
}

export const openaiProjectService = new OpenAIProjectService();
