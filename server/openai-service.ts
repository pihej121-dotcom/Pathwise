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

// Default role archetypes (fallback)
const ROLE_ARCHETYPES = [
  { label: "Software Engineer", description: "Builds applications, APIs, and systems using programming languages" },
  { label: "Data Scientist", description: "Analyzes data, builds ML models, creates insights from datasets" },
  { label: "Product Manager", description: "Manages product roadmaps, works with stakeholders, defines requirements" },
  { label: "Data Analyst", description: "Creates reports, analyzes business metrics, uses SQL and BI tools" },
  { label: "Researcher", description: "Conducts studies, publishes papers, investigates problems systematically" },
  { label: "Designer", description: "Creates user interfaces, experiences, visual designs, prototypes" },
  { label: "Marketing Professional", description: "Develops campaigns, manages brand, analyzes customer data" },
  { label: "Consultant", description: "Advises clients, solves business problems, implements solutions" },
  { label: "Engineer", description: "Designs systems, solves technical problems, builds infrastructure" },
  { label: "Business Analyst", description: "Analyzes processes, gathers requirements, improves operations" }
];

export class AIClassificationService {
  private initialized = false;
  private archetypeEmbeddings: Map<string, number[]> = new Map();
  private resumeEmbeddings: Map<string, number[]> = new Map();

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.loadOrComputeArchetypeEmbeddings();
    this.initialized = true;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  private getCacheKey(text: string): string {
    return createHash("sha256").update(text).digest("hex").substring(0, 16);
  }

  private async embedText(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000)
    });
    return response.data[0].embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (magA * magB);
  }

  private async loadOrComputeArchetypeEmbeddings() {
    const cacheFile = "/tmp/archetype_embeddings_v1.json";

    if (fs.existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
        this.archetypeEmbeddings = new Map(cached.embeddings);
        return;
      } catch (err) {
        console.warn("Failed to load cached embeddings, recomputing:", err);
      }
    }

    // Compute fresh embeddings
    for (const archetype of ROLE_ARCHETYPES) {
      try {
        const embedding = await this.embedText(archetype.description);
        this.archetypeEmbeddings.set(archetype.label, embedding);
      } catch (err) {
        console.warn(`Failed to embed archetype ${archetype.label}:`, err);
      }
    }

    fs.writeFileSync(
      cacheFile,
      JSON.stringify({
        embeddings: Array.from(this.archetypeEmbeddings.entries()),
        version: 1,
        timestamp: Date.now()
      })
    );
  }

  async classifyBackground(resumeText: string, targetRole?: string): Promise<{ label: string; summary: string }> {
    await this.ensureInitialized();
    try {
      // Cache resume embedding
      const resumeKey = this.getCacheKey(resumeText);
      let resumeEmbedding = this.resumeEmbeddings.get(resumeKey);

      if (!resumeEmbedding) {
        resumeEmbedding = await this.embedText(resumeText);
        this.resumeEmbeddings.set(resumeKey, resumeEmbedding);
      }

      // Compute similarities
      const similarities = Array.from(this.archetypeEmbeddings.entries())
        .map(([label, embedding]) => ({
          label,
          similarity: this.cosineSimilarity(resumeEmbedding!, embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 2);

      // GPT summary
      const prompt = `Based on this resume, create a concise background summary for a professional transitioning to ${
        targetRole || "a new role"
      }.
Resume excerpt: ${resumeText.substring(0, 1000)}...
Top matching backgrounds: ${similarities.map(s => s.label).join(", ")}
Return JSON:
{
  "label": "Most relevant background category",
  "summary": "1-2 sentence personalized background"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 150,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        label: result.label || similarities[0]?.label || "Professional",
        summary: result.summary || `${similarities[0]?.label || "Professional"} with relevant experience`
      };
    } catch (error) {
      console.error("Background classification failed:", error);
      return { label: "Professional", summary: "Professional with technical background" };
    }
  }

  async classifySkillDifficulty(
    skill: string,
    resumeText: string,
    targetRole?: string
  ): Promise<"beginner" | "intermediate" | "advanced"> {
    try {
      const quick = this.getQuickSkillDifficulty(skill, resumeText);
      if (quick.confidence > 0.8) return quick.level as any;

      // GPT fallback
      const prompt = `Assess the skill difficulty level for "${skill}" given this resume:
Resume context: ${resumeText.substring(0, 800)}...
Target role: ${targetRole || "Not specified"}
Return JSON:
{"difficulty": "beginner|intermediate|advanced"}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 50,
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      if (["beginner", "intermediate", "advanced"].includes(result.difficulty)) {
        return result.difficulty;
      }

      return "intermediate";
    } catch (error) {
      console.error("Skill classification failed:", error);
      return "intermediate";
    }
  }

  private getQuickSkillDifficulty(skill: string, resumeText: string): { level: string; confidence: number } {
    const skillLower = skill.toLowerCase();
    const textLower = resumeText.toLowerCase();

    const mentions = (textLower.match(new RegExp(skillLower, "g")) || []).length;

    if (mentions >= 3) return { level: "advanced", confidence: 0.9 };
    if (mentions === 1 || mentions === 2) return { level: "intermediate", confidence: 0.85 };
    return { level: "beginner", confidence: 0.9 };
  }
}

export const aiClassificationService = new AIClassificationService();
