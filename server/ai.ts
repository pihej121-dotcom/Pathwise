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

IMPORTANT: Break down the roadmap into 4-6 digestible subsections, each with specific tasks that can be completed and checked off.

Return JSON format with:
{
  "title": "Roadmap title",
  "description": "Brief overview of this phase",
  "actions": [legacy actions array for compatibility],
  "subsections": [
    {
      "title": "Subsection name (e.g., 'Build Technical Skills')",
      "description": "What this subsection accomplishes",
      "estimatedHours": "Time commitment (e.g., '2-3 hours/week')",
      "tasks": [
        {
          "id": "unique_task_id",
          "title": "Specific actionable task",
          "description": "Detailed explanation of what to do",
          "dueDate": "YYYY-MM-DD",
          "priority": "high|medium|low",
          "resources": ["resource1", "resource2"],
          "completed": false
        }
      ]
    }
  ]
}

Make each subsection focused on a specific area like:
- Technical Skills Development
- Professional Network Building  
- Resume & Portfolio Enhancement
- Job Search Strategy
- Interview Preparation
- Industry Knowledge Building

Each task should be:
- Specific and actionable
- Completable within 1-2 weeks
- Have clear deliverables
- Include helpful resources`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a career strategist creating digestible, actionable roadmaps. Break complex goals into manageable subsections with clear tasks that users can check off as they complete them."
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

      const result = JSON.parse(response.choices[0].message.content || "{}");
      console.log("OpenAI AI analysis result:", JSON.stringify(result, null, 2));
      return result;
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

  async generateCoverLetter({ jobTitle, company, jobDescription, resumeText }: {
    jobTitle: string;
    company: string;
    jobDescription: string;
    resumeText: string;
  }) {
    const prompt = `As an expert career coach, create a compelling cover letter for this job application:

JOB DETAILS:
- Position: ${jobTitle}
- Company: ${company}
- Job Description: ${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

REQUIREMENTS:
1. Write a professional, engaging cover letter
2. Highlight relevant experience from the resume that matches the job requirements
3. Show enthusiasm for the specific role and company
4. Keep it concise (3-4 paragraphs)
5. Use a professional tone while showing personality
6. Include specific examples from the resume that demonstrate qualifications
7. Address potential concerns or gaps constructively
8. End with a strong call to action

Return only the cover letter text, no additional formatting or explanations.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      return response.choices[0].message.content?.trim() || "";
    } catch (error) {
      console.error("OpenAI cover letter generation error:", error);
      throw new Error("Failed to generate cover letter");
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
        temperature: 0.7,
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
        temperature: 0.7,
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
        temperature: 0.7,
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
