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
    const prompt = `Generate a comprehensive micro-internship project for a ${request.userBackground} transitioning to ${request.targetRole}.

Target Skill Gap: ${request.skillGap}
Skill Category: ${request.skillCategory}
Difficulty Level: ${request.difficultyLevel}

Create a project that:
1. Has a clear, professional title (8-12 words)
2. Provides actionable description (2-3 sentences)
3. Includes step-by-step instructions with specific tasks, templates, and resources
4. Lists concrete deliverables the user will produce
5. Suggests evaluation criteria for self-assessment
6. Provides real-world examples and templates
7. Estimates realistic completion time (8-20 hours)

The instructions should be detailed enough that someone can complete the project entirely from your guidance, including specific tools, templates, and resources to use.

Respond with JSON in this exact format:
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
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert career development specialist who creates comprehensive micro-internship projects. Generate detailed, actionable project instructions that users can complete end-to-end using only your guidance and recommended resources."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const projectData = JSON.parse(response.choices[0].message.content || '{}');
      
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
      throw new Error("Failed to generate AI-powered project");
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
        model: "gpt-5",
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