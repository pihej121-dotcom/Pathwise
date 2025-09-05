import OpenAI from "openai";

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
    weeknessesOverview: string;
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

interface RoadmapAction {
  id: string;
  title: string;
  description: string;
  rationale: string;
  icon: string;
  completed: boolean;
  dueDate?: string;
}

interface JobMatchAnalysis {
  compatibilityScore: number;
  matchReasons: string[];
  skillsGaps: string[];
  resourceLinks: Array<{
    skill: string;
    resources: Array<{
      title: string;
      provider: string;
      url: string;
      cost?: string;
    }>;
  }>;
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
  async analyzeResume(resumeText: string, targetRole?: string, targetIndustry?: string, targetCompanies?: string): Promise<ResumeAnalysis> {
    try {
      const prompt = `Provide a comprehensive analysis of this resume against the target career goals. Give detailed insights into each section with specific explanations.

Resume text:
${resumeText}

Target Role: ${targetRole}
Target Industry: ${targetIndustry || 'Not specified'}
Target Companies: ${targetCompanies || 'Not specified'}

Provide thorough analysis in JSON format with:

1. OVERALL SCORES (0-100, be realistic - most should score 40-70):
- rmsScore: Overall resume match score
- skillsScore: Technical and soft skills evaluation
- experienceScore: Relevant experience assessment
- keywordsScore: Industry keywords and ATS optimization
- educationScore: Educational qualifications
- certificationsScore: Professional certifications

2. OVERALL INSIGHTS:
- scoreExplanation: Detailed explanation of why they received their overall score
- strengthsOverview: Summary of the resume's strongest points
- weaknessesOverview: Summary of the main areas for improvement
- keyRecommendations: 3-4 high-impact recommendations

3. DETAILED SECTION ANALYSIS for each area (skills, experience, keywords, education, certifications):
- score: Section-specific score (0-100)
- strengths: Array of specific positive aspects found in this section
- gaps: Array of specific missing elements for the target role
- explanation: Detailed explanation of the score and assessment
- improvements: Array of specific actionable improvements

4. PRIORITIZED GAPS with resources:
- category: Specific gap (e.g., "Python Programming", "Leadership Experience")
- priority: high/medium/low based on target role importance
- impact: Expected score improvement (+5-25 points) if addressed
- rationale: Why this gap matters for the target role
- resources: 2-3 high-quality learning resources with real URLs

Focus on being thorough, specific, and constructive. Explain your reasoning clearly.`;

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
  ): Promise<{ title: string; description: string; actions: RoadmapAction[] }> {
    try {
      const phaseLabels = {
        "30_days": "30-Day Sprint",
        "3_months": "3-Month Foundation",
        "6_months": "6-Month Transformation"
      };

      const prompt = `Generate a personalized career roadmap for the ${phaseLabels[phase]} phase.

User Profile:
- Target Role: ${userProfile.targetRole}
- Industries: ${userProfile.industries?.join(", ") || "general"}
- Location: ${userProfile.location || "flexible"}
- Remote OK: ${userProfile.remoteOk}
- School: ${userProfile.school}
- Major: ${userProfile.major}
- Graduation Year: ${userProfile.gradYear}

${resumeAnalysis ? `Resume Analysis Gaps: ${JSON.stringify(resumeAnalysis.gaps)}` : ""}

Create 3-4 specific, measurable actions for this phase. Each action should include:
- id: unique identifier
- title: concise action title
- description: detailed explanation
- rationale: why this action is important
- icon: Font Awesome icon class (e.g., "fas fa-graduation-cap")
- completed: false
- dueDate: specific date within the phase

Provide response in JSON format with title, description, and actions array.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a career strategist creating personalized, actionable roadmaps. Focus on specific, measurable objectives with clear timelines."
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
      console.error("Roadmap generation error:", error);
      throw new Error("Failed to generate career roadmap");
    }
  }

  async analyzeJobMatch(
    jobDescription: string,
    resumeText: string,
    userProfile: any
  ): Promise<JobMatchAnalysis> {
    try {
      const prompt = `Analyze the compatibility between this candidate and job posting.

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Candidate Profile:
- Target Role: ${userProfile.targetRole}
- Industries: ${userProfile.industries?.join(", ") || "general"}
- Location Preference: ${userProfile.location}
- Remote OK: ${userProfile.remoteOk}

Provide analysis in JSON format:
- compatibilityScore (0-100): Overall match percentage
- matchReasons: Array of specific reasons why this is a good match
- skillsGaps: Array of missing or weak skills identified
- resourceLinks: Array of objects with skill and resources to address gaps (title, provider, url, cost)

Focus on explainable matching and actionable gap closure.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert recruiter and career matcher. Provide honest, detailed compatibility analysis with specific improvement recommendations."
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
      console.error("Job match analysis error:", error);
      throw new Error("Failed to analyze job match");
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
}

export const aiService = new AIService();
