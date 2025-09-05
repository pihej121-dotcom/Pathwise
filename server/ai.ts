import OpenAI from "openai";
import { z } from "zod";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface ResumeAnalysis {
  rmsScore: number;
  skillsScore: number;
  experienceScore: number;
  keywordsScore: number;
  educationScore: number;
  certificationsScore: number;
  overallInsights: {
    scoreExplanation: string;
    strengthsOverview: string;
    weaknessesOverview: string;
    keyRecommendations: string[];
  };
  sectionAnalysis: {
    skills: {
      score: number;
      strengths: string[];
      gaps: string[];
      explanation: string;
      improvements: string[];
    };
    experience: {
      score: number;
      strengths: string[];
      gaps: string[];
      explanation: string;
      improvements: string[];
    };
    keywords: {
      score: number;
      strengths: string[];
      gaps: string[];
      explanation: string;
      improvements: string[];
    };
    education: {
      score: number;
      strengths: string[];
      gaps: string[];
      explanation: string;
      improvements: string[];
    };
    certifications: {
      score: number;
      strengths: string[];
      gaps: string[];
      explanation: string;
      improvements: string[];
    };
  };
  gaps: Array<{
    category: string;
    priority: "high" | "medium" | "low";
    impact: number;
    rationale: string;
    resources: Array<{
      title: string;
      provider: string;
      url: string;
      cost?: string;
    }>;
  }>;
}

interface JobMatchAnalysis {
  overallMatch: number;
  strengths: string[];
  concerns: string[];
  skillsAnalysis: {
    strongMatches: string[];
    partialMatches: string[];
    missingSkills: string[];
    explanation: string;
  };
  experienceAnalysis: {
    relevantExperience: string[];
    experienceGaps: string[];
    explanation: string;
  };
  recommendations: string[];
  nextSteps: string[];
}

interface RoadmapAction {
  id: string;
  title: string;
  description: string;
  rationale: string;
  icon: string;
  completed: boolean;
  dueDate?: string;
}

interface TailoredResumeResult {
  tailoredContent: string;
  jobSpecificScore: number;
  keywordsCovered: string[];
  remainingGaps: Array<{
    skill: string;
    importance: string;
    resources: Array<{
      title: string;
      provider: string;
      url: string;
      cost?: string;
    }>;
  }>;
  diffJson: Array<{
    type: "add" | "remove" | "modify";
    section: string;
    original?: string;
    new?: string;
    reason: string;
  }>;
}

export class AIService {

  // Two-pass atomization: refines tasks to ensure they're truly bite-sized
  private async atomizeTasks(subsections: any[]): Promise<any[]> {
    try {
      const atomizePrompt = `You are a task atomizer. Your job is to ensure every task is truly atomic and bite-sized.

REVIEW these subsections and split ANY task that:
- Has multiple sentences
- Contains "and", "then", "also", "additionally"  
- Takes longer than 60 minutes
- Has multiple deliverables
- Is vague or complex

ATOMIZATION RULES:
1. Each task = ONE verb + ONE object
2. Completable in 20-60 minutes
3. Single clear outcome
4. Title max 60 chars, description max 140 chars
5. Keep same JSON structure

INPUT SUBSECTIONS:
${JSON.stringify(subsections, null, 2)}

Return JSON in this format: { "subsections": [...] }

ID REQUIREMENTS: 
- Preserve existing task IDs when possible
- Generate new RFC-4122 UUID v4 for new tasks created by splitting
- Maintain dependencies and copy them to all resulting tasks from a split`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system", 
            content: "You are a precision task atomizer. Split complex tasks into atomic, trackable actions. Return JSON only."
          },
          {
            role: "user",
            content: atomizePrompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000
      });

      const atomizedResult = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate the atomized result
      const { roadmapSubsectionSchema } = await import("@shared/schema");
      const validatedSubsections = z.array(roadmapSubsectionSchema).parse(atomizedResult.subsections || []);
      
      return validatedSubsections;
      
    } catch (error) {
      console.error("Task atomization failed:", error);
      return subsections; // Return original if atomization fails
    }
  }

  async analyzeJobMatch(resumeText: string, jobData: any): Promise<JobMatchAnalysis> {
    try {
      const prompt = `You are an expert career counselor analyzing how well a candidate's resume matches a specific job posting. Provide detailed, personalized feedback.

CANDIDATE RESUME:
${resumeText}

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company?.display_name || 'Not specified'}
Description: ${jobData.description || 'No description provided'}
Location: ${jobData.location?.display_name || 'Not specified'}
Employment Type: ${jobData.contract_type || 'Not specified'}

Analyze this match and respond with a JSON object containing:
{
  "overallMatch": <number 1-100>,
  "strengths": [<specific strengths from resume that match job requirements>],
  "concerns": [<specific concerns or gaps for this role>],
  "skillsAnalysis": {
    "strongMatches": [<skills from resume that strongly match job>],
    "partialMatches": [<skills that partially match or are transferable>],
    "missingSkills": [<important skills mentioned in job but missing from resume>],
    "explanation": "<detailed explanation of skills fit>"
  },
  "experienceAnalysis": {
    "relevantExperience": [<specific experiences from resume relevant to this job>],
    "experienceGaps": [<experience gaps that could be concerning>],
    "explanation": "<detailed explanation of experience fit>"
  },
  "recommendations": [<specific actionable advice for this application>],
  "nextSteps": [<concrete steps to improve candidacy for this role>]
}

Focus on being specific and actionable. Reference actual content from the resume and job description.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis;
    } catch (error) {
      console.error('AI job match analysis failed:', error);
      // Return fallback analysis
      return {
        overallMatch: 75,
        strengths: ["Experience relevant to the role", "Strong technical background"],
        concerns: ["Some skills gaps may need addressing"],
        skillsAnalysis: {
          strongMatches: ["Skills from your background"],
          partialMatches: ["Transferable skills"],
          missingSkills: ["Additional skills to develop"],
          explanation: "AI analysis temporarily unavailable - showing general assessment"
        },
        experienceAnalysis: {
          relevantExperience: ["Your professional experience"],
          experienceGaps: ["Areas for growth"],
          explanation: "AI analysis temporarily unavailable - showing general assessment"
        },
        recommendations: ["Highlight relevant experience", "Consider skill development"],
        nextSteps: ["Apply with current qualifications", "Continue professional development"]
      };
    }
  }

  async analyzeResume(resumeText: string, targetRole?: string, targetIndustry?: string, targetCompanies?: string): Promise<ResumeAnalysis> {
    try {
      const prompt = `Analyze this resume for the target role and provide a JSON response with specific scores and gaps.

Resume text:
${resumeText}

Target Role: ${targetRole}
Target Industry: ${targetIndustry || 'Not specified'}
Target Companies: ${targetCompanies || 'Not specified'}

Provide analysis in this exact JSON format:
{
  "rmsScore": 65,
  "skillsScore": 70,
  "experienceScore": 60,
  "keywordsScore": 55,
  "educationScore": 80,
  "certificationsScore": 40,
  "gaps": [
    {
      "category": "Python Programming",
      "priority": "high",
      "impact": 15,
      "rationale": "Python is essential for this role",
      "resources": [
        {
          "title": "Python for Everybody",
          "provider": "Coursera",
          "url": "https://coursera.org/python",
          "cost": "Free"
        }
      ]
    }
  ]
}

Be realistic with scores (40-80 range). Focus on identifying actual gaps between the resume and target role requirements.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert career counselor specializing in gap analysis. Your job is to identify specific gaps between a candidate's current resume and their target role requirements. Be honest about missing skills and experience. Provide actionable recommendations with real resources."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Resume analysis error:", error);
      throw new Error("Failed to analyze resume");
    }
  }

  async generateCareerRoadmap(
    phase: "30_days" | "3_months" | "6_months",
    userProfile: any,
    resumeAnalysis?: ResumeAnalysis
  ): Promise<{ title: string; description: string; actions: RoadmapAction[]; subsections: any[] }> {
    try {
      const phaseLabels = {
        "30_days": "30-Day Sprint",
        "3_months": "3-Month Foundation", 
        "6_months": "6-Month Transformation"
      };

      // System prompt to enforce atomic task structure
      const systemPrompt = `You are an expert career coach who creates ATOMIC, bite-sized career tasks. You MUST follow these strict rules:

ATOMIC TASK RULES:
1. Each task = ONE verb + ONE object (e.g., "Update LinkedIn headline", "Schedule coffee chat")
2. No compound actions with "and", "then", or multiple steps
3. Each task completable in 20-60 minutes max
4. No paragraphs or dense descriptions
5. Title: 5-60 characters, description: 10-140 characters
6. Each task has 3-5 definition-of-done bullets (max 80 chars each)

RESPONSE FORMAT: JSON only, no markdown. Follow the exact schema.`;

      const userPrompt = `Create an atomic career roadmap for ${phaseLabels[phase]}.

USER CONTEXT:
Target Role: ${userProfile.targetRole}
Industries: ${userProfile.industries?.join(", ") || "general"}
Background: ${userProfile.major} at ${userProfile.school}
${resumeAnalysis ? `Key Gaps: ${resumeAnalysis.gaps?.slice(0, 3).map(g => g.category).join(", ")}` : ""}

STRICT SCHEMA REQUIREMENTS:
{
  "phase": "${phase}",
  "title": "10-100 chars",
  "description": "20-300 chars roadmap overview",
  "estimatedWeeks": 2-12,
  "subsections": [
    {
      "id": "GENERATE RFC-4122 UUID v4",
      "title": "5-80 chars",
      "description": "10-200 chars what this section accomplishes", 
      "estimatedHours": 1-5,
      "priority": "high|medium|low",
      "tasks": [
        {
          "id": "GENERATE RFC-4122 UUID v4",
          "title": "5-60 chars - ONE action verb + object",
          "description": "10-140 chars - HOW to do it",
          "estimatedMinutes": 20-60,
          "priority": "high|medium|low", 
          "definitionOfDone": ["criteria 1", "criteria 2", "criteria 3"],
          "resources": [{"title": "max 50 chars", "url": "https://example.com"}],
          "dependencies": [],
          "completed": false
        }
      ]
    }
  ]
}

ID REQUIREMENTS: Generate proper RFC-4122 UUID v4 for every "id" field (format: 12345678-1234-4567-8901-123456789012)

RESOURCE REQUIREMENTS: 
- URLs must start with https:// or http://
- Resources are OPTIONAL - only include if truly helpful
- Max 2 resources per task

REQUIRED: 4-6 subsections, 3-5 tasks each. Focus areas:
- Skills Development
- Network Building
- Application Materials
- Job Search Execution  
- Interview Preparation

EXAMPLE ATOMIC TASKS (good):
✓ "Update LinkedIn headline" (not "Update LinkedIn profile with new headline...")
✓ "Schedule coffee chat" (not "Reach out to connections and schedule...")
✓ "Apply to 3 companies" (not "Research companies and submit applications...")

EXAMPLE NON-ATOMIC (bad):
✗ "Research target companies, update resume, and apply to positions"
✗ "Build comprehensive portfolio showcasing all projects" 
✗ Dense paragraph descriptions`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000 // Increased for complex roadmaps
      });

      const rawContent = response.choices[0].message.content;
      if (!rawContent) {
        throw new Error("No content received from AI");
      }

      // Parse and validate with schema
      let parsedRoadmap;
      try {
        parsedRoadmap = JSON.parse(rawContent);
      } catch (error) {
        throw new Error("Invalid JSON response from AI");
      }

      // Validate against atomic roadmap schema
      const { atomicRoadmapSchema } = await import("@shared/schema");
      let validatedRoadmap = atomicRoadmapSchema.parse(parsedRoadmap);

      // Second pass: atomize tasks to ensure they're truly bite-sized
      console.log("Running second pass atomization...");
      const atomizedSubsections = await this.atomizeTasks(validatedRoadmap.subsections);
      validatedRoadmap = { ...validatedRoadmap, subsections: atomizedSubsections };

      // Transform to legacy format for compatibility
      const legacyActions: RoadmapAction[] = validatedRoadmap.subsections.flatMap(subsection =>
        subsection.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          rationale: `Part of ${subsection.title}`,
          icon: "📝",
          completed: task.completed || false
        }))
      );

      return {
        title: validatedRoadmap.title,
        description: validatedRoadmap.description,
        actions: legacyActions,
        subsections: validatedRoadmap.subsections
      };
    } catch (error) {
      console.error("Atomic roadmap generation error:", error);
      
      // Fallback: try to repair or regenerate
      if ((error as Error).message?.includes("validation")) {
        console.log("Schema validation failed, attempting repair...");
        // Could implement a repair prompt here
      }
      
      throw new Error("Failed to generate atomic career roadmap");
    }
  }


  async tailorResume(
    baseResumeText: string,
    jobDescription: string,
    targetKeywords: string[],
    userProfile: any
  ): Promise<TailoredResumeResult> {
    try {
      const prompt = `Tailor this resume for the specific job posting. DO NOT fabricate experience, employers, dates, degrees, certifications, or metrics.

Base Resume:
${baseResumeText}

Job Description:
${jobDescription}

Target Keywords: ${targetKeywords.join(", ")}

GUIDELINES:
- Only reorder, reword, merge, or quantify existing content
- Add skills/projects only if already present in user's data
- Mark any inferred numbers as "(est.)"
- Provide ATS-safe formatting
- Focus on keyword optimization and relevance

Provide JSON response:
- tailoredContent: Complete rewritten resume text
- jobSpecificScore: Estimated match score (0-100) for this job
- keywordsCovered: Array of target keywords successfully incorporated
- remainingGaps: Array of gaps still present (skill, importance, resources)
- diffJson: Array of all changes made (type: add/remove/modify, section, original, new, reason)

Ensure all changes are explainable and auditable.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional resume writer who optimizes resumes for specific jobs. Never fabricate information - only enhance and reorganize existing content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Resume tailoring error:", error);
      throw new Error("Failed to tailor resume");
    }
  }

  async generateCoverLetter(
    resumeText: string,
    jobDescription: string,
    company: string,
    role: string
  ): Promise<string> {
    try {
      const prompt = `Generate a professional cover letter for this job application.

Resume:
${resumeText}

Job Description:
${jobDescription}

Company: ${company}
Role: ${role}

Create a compelling, personalized cover letter that:
- Shows genuine interest in the company
- Highlights relevant experience from the resume
- Addresses key job requirements
- Maintains professional tone
- Is 3-4 paragraphs long

Return only the cover letter text, no JSON format needed.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional career coach who writes compelling, personalized cover letters that highlight candidate strengths."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Cover letter generation error:", error);
      throw new Error("Failed to generate cover letter");
    }
  }

  async optimizeLinkedInProfile(
    currentProfile: string,
    targetRole: string,
    targetIndustries: string[]
  ): Promise<{
    headline: string;
    about: string;
    skills: string[];
    improvements: string[];
  }> {
    try {
      const prompt = `Optimize this LinkedIn profile for better visibility and professional impact.

Current Profile:
${currentProfile}

Target Role: ${targetRole}
Target Industries: ${targetIndustries.join(", ")}

Provide optimized content in JSON format:
- headline: Professional headline (under 120 characters)
- about: Optimized about section (2-3 paragraphs)
- skills: Top 10 skills to highlight
- improvements: Array of specific improvement suggestions

Focus on keyword optimization, professional branding, and industry alignment.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a LinkedIn optimization expert who helps professionals build strong personal brands and increase visibility to recruiters."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("LinkedIn optimization error:", error);
      throw new Error("Failed to optimize LinkedIn profile");
    }
  }


  async generateCareerInsights({ resumeText, targetRole, experience }: {
    resumeText: string;
    targetRole?: string;
    experience?: string;
  }) {
    const prompt = `As an expert career coach and industry analyst, provide comprehensive career insights and recommendations:

RESUME CONTENT:
${resumeText}

TARGET ROLE: ${targetRole || "Not specified"}
EXPERIENCE LEVEL: ${experience || "Not specified"}

Please analyze and provide:

1. CAREER STRENGTHS (3-4 key strengths based on resume)
2. SKILL GAPS (3-4 skills to develop for target role or career growth)
3. INDUSTRY TRENDS (relevant trends affecting their field)
4. NEXT STEPS (3-4 actionable recommendations)
5. NETWORKING ADVICE (specific to their field/target role)
6. INTERVIEW PREP TIPS (based on their background and target role)

Format your response as JSON with these keys:
{
  "strengths": ["strength1", "strength2", ...],
  "skillGaps": ["gap1", "gap2", ...],
  "industryTrends": ["trend1", "trend2", ...],
  "nextSteps": ["step1", "step2", ...],
  "networkingAdvice": "specific networking guidance...",
  "interviewTips": "tailored interview preparation advice..."
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },

      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");
      
      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI career insights error:", error);
      throw new Error("Failed to generate career insights");
    }
  }

  async generateSalaryNegotiation({ resumeText, currentSalary, targetSalary, jobRole, location, yearsExperience }: {
    resumeText: string;
    currentSalary?: string;
    targetSalary: string;
    jobRole: string;
    location?: string;
    yearsExperience?: string;
  }) {
    const prompt = `As an expert salary negotiation coach and compensation analyst, create a personalized negotiation strategy:

CANDIDATE'S RESUME:
${resumeText}

SALARY NEGOTIATION DETAILS:
- Current Salary: ${currentSalary || "Not provided"}
- Target Salary: ${targetSalary}
- Job Role: ${jobRole}
- Location: ${location || "Not specified"}
- Years of Experience: ${yearsExperience || "Not specified"}

Based on the candidate's resume, experience, skills, and qualifications, provide a comprehensive salary negotiation strategy in JSON format:

{
  "marketAnalysis": {
    "salaryRange": "Market salary range for this role and location",
    "percentilePosition": "Where the target salary sits in the market (e.g., 75th percentile)",
    "marketFactors": ["factor1", "factor2", "factor3"]
  },
  "strengthsToHighlight": [
    "Key strengths from their resume to emphasize",
    "Specific achievements with quantifiable impact",
    "Unique skills or experiences that add value"
  ],
  "negotiationStrategy": {
    "approach": "Overall negotiation approach based on their background",
    "timing": "Best timing for the negotiation conversation",
    "alternatives": "What to do if initial offer is rejected"
  },
  "scriptExamples": {
    "openingStatement": "How to start the salary conversation",
    "valueProposition": "How to articulate their value based on resume",
    "counterOffer": "How to counter if offer is below target"
  },
  "additionalLeverage": [
    "Non-salary benefits they could negotiate",
    "Professional development opportunities",
    "Equity or bonus considerations"
  ],
  "riskAssessment": "Assessment of negotiation risks based on their experience level",
  "nextSteps": ["step1", "step2", "step3"]
}

Focus on their specific qualifications, experience level, and achievements from the resume.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },

      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");
      
      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI salary negotiation error:", error);
      throw new Error("Failed to generate salary negotiation strategy");
    }
  }

  async updateResumeFromRoadmap({ resumeText, completedTasks }: {
    resumeText: string;
    completedTasks: Array<{
      title: string;
      description?: string;
      actions?: any;
    }>;
  }) {
    const prompt = `As an expert resume writer and career coach, update this resume by incorporating completed career roadmap tasks:

CURRENT RESUME:
${resumeText}

COMPLETED ROADMAP TASKS:
${completedTasks.map(task => `
- ${task.title}
  Description: ${task.description || "No description"}
  Actions: ${JSON.stringify(task.actions || [])}
`).join('\n')}

Instructions:
1. Analyze the completed tasks and identify new skills, experiences, or achievements
2. Integrate these naturally into the appropriate resume sections
3. Enhance existing experience descriptions where relevant
4. Add new technical skills to the skills section
5. Ensure all additions sound professional and quantifiable when possible
6. Maintain the resume's original structure and tone

Return the updated resume content as a JSON object:
{
  "updatedResumeText": "The complete updated resume text",
  "changesApplied": [
    "List of specific changes made based on roadmap tasks"
  ],
  "newSkillsAdded": ["skill1", "skill2", "skill3"],
  "enhancedSections": ["section1", "section2"]
}

Make the improvements realistic and professional, avoiding exaggeration while maximizing the impact of completed learning.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },

      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");
      
      return JSON.parse(content);
    } catch (error) {
      console.error("OpenAI resume update error:", error);
      throw new Error("Failed to update resume from roadmap");
    }
  }
}

export const aiService = new AIService();
