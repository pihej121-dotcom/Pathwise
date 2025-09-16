import OpenAI from "openai";
import { z } from "zod";
import { randomUUID } from "crypto";
import { jobMatchAnalysisSchema, JobMatchAnalysis, getCompetitivenessBand } from '@shared/schema';

// Using GPT-4o for reliable performance
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
        model: "gpt-4o", // Using GPT-4o for reliable performance
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
      const { insertRoadmapSubsectionSchema } = await import("@shared/schema");
      const validatedSubsections = z.array(insertRoadmapSubsectionSchema).parse(atomizedResult.subsections || []);
      
      return validatedSubsections;
      
    } catch (error) {
      console.error("Task atomization failed:", error);
      return subsections; // Return original if atomization fails
    }
  }

  async analyzeJobMatch(resumeText: string, jobData: any): Promise<JobMatchAnalysis> {
    try {
      const prompt = `You are an expert career counselor and hiring manager analyzing how well a candidate's resume matches a specific job posting. Provide comprehensive, data-driven insights that quantify why the candidate is or isn't competitive for this role.

CANDIDATE RESUME:
${resumeText}

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company?.display_name || 'Not specified'}
Description: ${jobData.description || 'No description provided'}
Location: ${jobData.location?.display_name || 'Not specified'}
Employment Type: ${jobData.contract_type || 'Not specified'}

ANALYSIS REQUIREMENTS:
- Be highly specific and reference exact details from both resume and job posting
- Quantify competitiveness with detailed reasoning
- Provide actionable, prioritized recommendations
- Focus on what matters most to hiring managers for this specific role

Respond with a comprehensive JSON object:
{
  "overallMatch": <number 1-100 representing overall competitiveness>,
  "strengths": [
    "<specific strength 1 with quantified impact>",
    "<specific strength 2 with evidence from resume>",
    "<specific strength 3 tied directly to job requirements>"
  ],
  "concerns": [
    "<critical gap 1 with impact assessment>",
    "<moderate concern 2 with context>",
    "<minor issue 3 if applicable>"
  ],
  "skillsAnalysis": {
    "strongMatches": [<exact skills from resume that directly match job requirements>],
    "partialMatches": [<transferable skills with explanation of relevance>],
    "missingSkills": [<critical skills from job posting absent in resume>],
    "explanation": "<200+ word detailed analysis of skills alignment, including: skill match percentage, most important gaps, transferability assessment, and competitive positioning relative to typical candidates>"
  },
  "experienceAnalysis": {
    "relevantExperience": [<specific roles/projects from resume most relevant to this job>],
    "experienceGaps": [<experience requirements from job that candidate lacks>],
    "explanation": "<200+ word detailed analysis including: years of relevant experience vs. requirements, industry alignment, responsibility level match, achievement relevance, and experience quality assessment>"
  },
  "recommendations": [
    "<high-impact recommendation 1 for immediate application improvement>",
    "<medium-impact recommendation 2 for cover letter/interview prep>",
    "<strategic recommendation 3 for long-term positioning>"
  ],
  "nextSteps": [
    "<immediate action 1 (within 24 hours)>",
    "<short-term action 2 (within 1 week)>",
    "<medium-term action 3 (within 1 month)>"
  ]
}

SCORING CRITERIA for overallMatch:
90-100: Exceptional fit - top 10% of candidates, likely to get interviews
80-89: Strong fit - competitive candidate with good interview chances  
70-79: Good fit - meets most requirements, moderate competition
60-69: Fair fit - meets basic requirements, needs strengthening
50-59: Weak fit - significant gaps, requires major improvements
Below 50: Poor fit - not competitive for this specific role

Focus on being brutally honest about competitiveness while providing constructive, actionable guidance.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o for reliable performance
        messages: [
          { role: "system", content: "You are an expert hiring manager. Respond with valid JSON exactly matching the required schema. No additional prose or markdown." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500, // Control token usage for cost optimization
        temperature: 0.3, // Lower temperature for more consistent analysis
        top_p: 0.9 // Focus on most relevant outputs
      });

      const rawAnalysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate the analysis using Zod schema for runtime safety
      try {
        // Add competitiveness band based on overall match score
        const analysisWithBand = {
          ...rawAnalysis,
          competitivenessBand: getCompetitivenessBand(rawAnalysis.overallMatch || 75)
        };
        
        const validatedAnalysis = jobMatchAnalysisSchema.parse(analysisWithBand);
        return validatedAnalysis;
      } catch (validationError) {
        console.error('AI analysis validation failed:', validationError);
        // Return structured fallback if validation fails
        return this.getFallbackAnalysis();
      }
    } catch (error) {
      console.error('AI job match analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  private getFallbackAnalysis(): JobMatchAnalysis {
    const fallbackScore = 75;
    return {
      overallMatch: fallbackScore,
      competitivenessBand: getCompetitivenessBand(fallbackScore),
      strengths: [
        "Professional background shows relevant experience for the role",
        "Educational qualifications align with industry standards", 
        "Demonstrated ability to learn and adapt to new environments"
      ],
      concerns: [
        "Some specific technical skills mentioned in the job posting may need validation",
        "Industry-specific experience depth requires assessment",
        "Certain advanced qualifications may need development"
      ],
      skillsAnalysis: {
        strongMatches: ["Core competencies from your professional background"],
        partialMatches: ["Transferable skills that can be applied to this role"],
        missingSkills: ["Role-specific technical skills that may require development"],
        explanation: "AI analysis is temporarily unavailable, but based on general patterns, your background likely includes transferable skills relevant to this position. A detailed review of specific technical requirements would provide more precise matching insights. Consider highlighting your most relevant experiences and any recent training or certifications that align with the job requirements."
      },
      experienceAnalysis: {
        relevantExperience: ["Professional roles and projects from your background"],
        experienceGaps: ["Specialized experience areas that may need strengthening"],
        explanation: "While detailed AI analysis is unavailable, your professional history likely contains valuable experience relevant to this role. Focus on quantifying your achievements and demonstrating measurable impact in previous positions. Consider how your experience directly addresses the core responsibilities mentioned in the job posting."
      },
      recommendations: [
        "Thoroughly review the job description and tailor your application to highlight the most relevant experiences",
        "Research the company and role to understand their specific needs and priorities",
        "Prepare specific examples that demonstrate your impact and problem-solving abilities"
      ],
      nextSteps: [
        "Within 24 hours: Customize your resume to emphasize the most relevant skills and experiences",
        "Within 1 week: Research the company culture and recent developments to personalize your cover letter",
        "Within 1 month: Consider additional training or certification in key areas identified in the job posting"
      ]
    };
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
          "title": "Python for Everybody Specialization",
          "provider": "Coursera",
          "url": "",
          "cost": "Free with audit option"
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENT: For the "url" field in resources, ONLY provide REAL, VERIFIED URLs to actual courses/resources. Use these verified URLs:

VERIFIED RESOURCE URLS:
Python:
- "https://www.coursera.org/specializations/python" (Python for Everybody)
- "https://www.udemy.com/course/complete-python-bootcamp/" (Complete Python Bootcamp)
- "https://www.codecademy.com/learn/learn-python-3" (Learn Python 3)

JavaScript/Web Development:
- "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/" (JavaScript Algorithms)
- "https://www.coursera.org/learn/html-css-javascript-for-web-developers" (Web Development)
- "https://www.udemy.com/course/the-complete-javascript-course/" (Complete JavaScript)

Data Science/Machine Learning:
- "https://www.coursera.org/professional-certificates/google-data-analytics" (Google Data Analytics)
- "https://www.coursera.org/learn/machine-learning" (Stanford Machine Learning)
- "https://www.kaggle.com/learn" (Kaggle Learn - Free)

Cloud/DevOps:
- "https://aws.amazon.com/training/digital/" (AWS Training)
- "https://docs.microsoft.com/en-us/learn/azure/" (Azure Learning)
- "https://cloud.google.com/training" (Google Cloud Training)

Project Management:
- "https://www.coursera.org/professional-certificates/google-project-management" (Google Project Management)
- "https://www.pmi.org/learning/training-development" (PMI Training)

General Career Skills:
- "https://www.linkedin.com/learning/" (LinkedIn Learning - various topics)
- "https://www.coursera.org/browse" (Coursera Catalog)
- "https://www.edx.org/" (edX Courses)
- "https://www.khanacademy.org/" (Khan Academy - Free)

If the specific skill doesn't match these, use the general platform URLs above. NEVER make up URLs - only use these verified ones.

Be realistic with scores (40-80 range). Focus on identifying actual gaps between the resume and target role requirements.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
  console.log(`Generating AI-powered career roadmap for phase: ${phase}`);

  try {
    // Phase-specific guidance
    const phaseInstructions: Record<string, string> = {
      "30_days": `
Focus on **quick wins and immediate actions**:
- Resume tailoring and LinkedIn optimization
- Apply to target jobs immediately
- Short, fast online courses or tutorials (1–2 weeks max)
- Network outreach to 5–10 people
- Prepare for upcoming interviews
`,
      "3_months": `
Focus on **medium-term development and momentum**:
- Complete 1–2 structured online courses or certifications
- Build a consistent weekly job application + networking system
- Start 1 small side project or portfolio addition
- Conduct 10–15 informational interviews
- Develop measurable improvements in interview performance
`,
      "6_months": `
Focus on **long-term strategy and positioning**:
- Complete advanced certifications or bootcamps
- Lead or contribute to a significant project/portfolio
- Deep industry research and thought leadership (blog posts, talks, communities)
- Develop specialized or leadership skills
- Build sustained mentorship relationships in the industry
`
    };

    // Build personalized prompt
    const prompt = `You are an expert career coach creating a personalized ${phase.replace('_', ' ')} career roadmap.

USER PROFILE:
- Target Role: ${userProfile?.targetRole || 'Career advancement'}
- Industries: ${userProfile?.industries?.join(', ') || 'General'}
- Education: ${userProfile?.major || 'Not specified'} at ${userProfile?.school || 'Not specified'}
- Experience Level: ${userProfile?.gradYear ? `Graduating ${userProfile.gradYear}` : 'Professional'}
- Target Companies: ${userProfile?.targetCompanies?.join(', ') || 'Various'}

${resumeAnalysis ? `RESUME ANALYSIS:
- Overall Score: ${resumeAnalysis.rmsScore}/100
- Key Skills Gaps: ${resumeAnalysis.gaps?.slice(0, 5).map(g => g.category).join(', ') || 'None identified'}
- Strengths: ${resumeAnalysis.overallInsights?.strengthsOverview || 'Professional background'}
` : ''}

INSTRUCTIONS FOR THIS TIMEFRAME:
${phaseInstructions[phase]}

Return JSON in this structure:
{
  "title": "Personalized title for their career plan",
  "description": "Brief description of what this plan will accomplish",
  "actions": [
    {
      "title": "Specific action step",
      "description": "Detailed description of how to complete this step",
      "rationale": "Why this step is important for their career goals",
      "icon": "📄",
      "completed": false
    }
  ]
}

Each action must clearly align with the ${phase.replace('_', ' ')} horizon. 
Do not just repeat the same actions for all phases.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach who creates personalized, actionable career development plans. Always respond with valid JSON."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
      temperature: 0.6
    });

    const rawContent = response.choices[0].message.content;
    if (!rawContent || rawContent.trim() === '') {
      throw new Error("Empty response from OpenAI");
    }

    const aiRoadmap = JSON.parse(rawContent);

    // --- Phase validation rules ---
    const validateActions = (actions: any[], phase: string) => {
      return actions.filter(action => {
        const text = (action.title + " " + action.description).toLowerCase();

        if (phase === "30_days") {
          // No long-term items
          if (text.includes("certification") || text.includes("bootcamp") || text.includes("long-term")) {
            return false;
          }
        }

        if (phase === "3_months") {
          // Allow small certs but not "multi-year" commitments
          if (text.includes("multi-year") || text.includes("advanced bootcamp")) {
            return false;
          }
        }

        if (phase === "6_months") {
          // Avoid only "resume update" or other one-day tasks
          if (text.includes("resume") || text.includes("linkedin")) {
            return false;
          }
        }

        return true;
      });
    };

    // Apply validation
    const validatedActions = validateActions(aiRoadmap.actions || [], phase);

    // Add IDs
    const actionsWithIds = validatedActions.map((action: any) => ({
      ...action,
      id: randomUUID(),
      completed: false
    }));

    return {
      title: aiRoadmap.title || `${phase.replace('_', ' ')} Career Plan`,
      description: aiRoadmap.description || `Personalized career development plan`,
      actions: actionsWithIds,
      subsections: []
    };

  } catch (error) {
    console.error("AI roadmap generation failed, using fallback:", error);

    const phaseName = phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const targetRole = userProfile?.targetRole || 'your target role';

    return {
      title: `${phaseName} Plan for ${targetRole}`,
      description: `A structured career plan tailored for advancing toward ${targetRole}`,
      actions: [
        {
          id: randomUUID(),
          title: `Update Resume for ${targetRole} Positions`,
          description: "Tailor your resume to highlight relevant experience and skills for your target role",
          rationale: "A targeted resume significantly increases interview opportunities",
          icon: "📄",
          completed: false
        },
        {
          id: randomUUID(),
          title: "Optimize LinkedIn Profile",
          description: "Update headline, summary, and skills to attract recruiters in your target industry",
          rationale: "LinkedIn optimization increases visibility by 40%",
          icon: "💼",
          completed: false
        },
        {
          id: randomUUID(),
          title: `Research ${userProfile?.industries?.[0] || 'Target'} Companies`,
          description: "Identify and research 15-20 companies that align with your career goals",
          rationale: "Targeted applications have 3x higher success rates",
          icon: "🔍",
          completed: false
        }
      ],
      subsections: []
    };
  }
}


  async tailorResume(baseResumeText: string, jobDescription: string, targetKeywords: string[], userProfile: any): Promise<TailoredResumeResult> {
    try {
      const prompt = `Tailor this resume for the job. Focus on keyword optimization.
      
Resume: ${baseResumeText}
Job: ${jobDescription}
Keywords: ${targetKeywords.join(", ")}

Provide JSON:
{
  "tailoredContent": "Updated resume text",
  "jobSpecificScore": 85,
  "keywordsCovered": ["keyword1", "keyword2"],
  "remainingGaps": [{"skill": "Python", "importance": "high", "resources": [{"title": "Course Name", "provider": "Provider Name", "url": "", "cost": "Free"}]}],
  "diffJson": [{"type": "modify", "section": "skills", "original": "old", "new": "new", "reason": "keyword optimization"}]
}

CRITICAL REQUIREMENT: For any resources in remainingGaps, use ONLY these REAL, VERIFIED URLs:
- Python: https://www.coursera.org/specializations/python
- JavaScript: https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/
- Data Science: https://www.coursera.org/professional-certificates/google-data-analytics
- AWS: https://aws.amazon.com/training/digital/
- Project Management: https://www.coursera.org/professional-certificates/google-project-management
- General Skills: https://www.linkedin.com/learning/
- Free Resources: https://www.khanacademy.org/
If no specific match, use https://www.coursera.org/browse or https://www.edx.org/`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional resume writer." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Resume tailoring error:", error);
      throw new Error("Failed to tailor resume");
    }
  }

  async generateCoverLetter(resumeText: string, jobDescription: string, company: string, role: string): Promise<string> {
    try {
      const prompt = `Write a professional cover letter for this application:
      
Resume: ${resumeText}
Job: ${jobDescription}
Company: ${company}
Role: ${role}

Create a compelling 3-4 paragraph cover letter.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional career coach who writes compelling cover letters." },
          { role: "user", content: prompt }
        ]
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Cover letter generation error:", error);
      throw new Error("Failed to generate cover letter");
    }
  }

  async optimizeLinkedInProfile(currentProfile: string, targetRole: string, targetIndustries: string[]) {
    try {
      const prompt = `Optimize this LinkedIn profile for ${targetRole} in ${targetIndustries.join(", ")}:
      
Current: ${currentProfile}

Provide JSON:
{
  "headline": "Optimized headline",
  "about": "Optimized about section",
  "skills": ["skill1", "skill2"],
  "improvements": ["suggestion1", "suggestion2"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a LinkedIn optimization expert." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("LinkedIn optimization error:", error);
      throw new Error("Failed to optimize LinkedIn profile");
    }
  }

  async generateCareerInsights({ resumeText, targetRole, experience }: { resumeText: string; targetRole?: string; experience?: string; }) {
    try {
      const prompt = `Provide career insights for this professional:
      
Resume: ${resumeText}
Target Role: ${targetRole}
Experience: ${experience}

Provide JSON with career recommendations and insights.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert career coach." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Career insights error:", error);
      throw new Error("Failed to generate career insights");
    }
  }

  async generateSalaryNegotiationStrategy({ currentSalary, targetSalary, jobRole, location, yearsExperience, resumeText }: { currentSalary: number; targetSalary: number; jobRole: string; location: string; yearsExperience: number; resumeText?: string; }) {
    try {
      const prompt = `Analyze this person's resume and create personalized salary negotiation advice:

RESUME: ${resumeText || 'Resume not provided'}

SALARY DETAILS:
- Current: ${currentSalary ? `$${currentSalary.toLocaleString()}` : 'Not disclosed'}
- Target: $${targetSalary.toLocaleString()}  
- Role: ${jobRole}
- Location: ${location}
- Experience: ${yearsExperience} years

Create a personalized salary negotiation strategy based on their specific skills, achievements, and experience shown in their resume. Begin with: "Based on your experience as a ${jobRole}, here's my personalized advice for negotiating your salary increase to $${targetSalary.toLocaleString()}..."

Write as natural conversation. Reference specific skills or achievements from their resume. Include market research for their role in ${location}. Give concrete talking points based on their actual background.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a friendly career coach having a conversation. Write your entire response as natural flowing text, like you're talking to someone face-to-face. Use "you" and "your" throughout. Write in complete sentences and paragraphs only. Never use JSON, never use structured data, never use brackets or quotes. Start every response with "Based on your experience as a ${jobRole}, here's my advice for negotiating your salary increase..." and continue with natural conversational advice.`
          },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9
      });

      let content = response.choices[0].message.content || "Unable to generate negotiation strategy at this time.";
      
      // NUCLEAR OPTION: Force convert ANY structured data to natural language
      if (content.includes('{') || content.includes('[') || content.includes('"') || content.includes('":')) {
        console.log("AI returned structured data, converting to natural language");
        
        // AGGRESSIVE text extraction and conversion
        let naturalContent = content;
        
        // If it's JSON, extract all values
        if (content.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(content);
            const values: string[] = [];
            
            const extractAllValues = (obj: any) => {
              if (typeof obj === 'string' && obj.length > 5) {
                values.push(obj);
              } else if (Array.isArray(obj)) {
                obj.forEach(extractAllValues);
              } else if (typeof obj === 'object' && obj !== null) {
                Object.values(obj).forEach(extractAllValues);
              }
            };
            
            extractAllValues(parsed);
            naturalContent = values.join(' ');
          } catch (e) {
            // Fallback: strip all JSON formatting
            naturalContent = content
              .replace(/[{}"\[\],]/g, ' ')
              .replace(/[a-z_]+:/gi, ' ')
              .replace(/\s+/g, ' ');
          }
        }
        
        // Clean up and make it conversational
        naturalContent = naturalContent
          .replace(/\s+/g, ' ')
          .replace(/\.\s*/g, '. ')
          .replace(/([.!?])\s*/g, '$1 ')
          .trim();
          
        // Force conversational tone
        if (!naturalContent.toLowerCase().includes('based on your experience')) {
          naturalContent = `Based on your experience as a ${jobRole}, here's my advice for negotiating your salary increase. ${naturalContent}`;
        }
        
        content = naturalContent;
      }
      
      // Final cleanup to ensure natural language
      content = content
        .replace(/^[^a-zA-Z]*/, '') // Remove leading non-letters
        .replace(/\s+/g, ' ')
        .trim();
      
      return content;
    } catch (error) {
      console.error("Salary negotiation error:", error);
      throw new Error("Failed to generate salary negotiation strategy");
    }
  }

  async updateResumeFromRoadmap({ resumeText, completedTasks }: { resumeText: string; completedTasks: any[]; }) {
    try {
      const prompt = `Update this resume based on completed roadmap tasks:
      
Resume: ${resumeText}
Completed Tasks: ${JSON.stringify(completedTasks)}

Provide JSON:
{
  "updatedResumeText": "Updated resume text",
  "changesApplied": ["List of changes"],
  "newSkillsAdded": ["skill1", "skill2"],
  "enhancedSections": ["section1", "section2"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional resume writer." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");
      
      return JSON.parse(content);
    } catch (error) {
      console.error("Resume update error:", error);
      throw new Error("Failed to update resume from roadmap");
    }
  }

  async generateInterviewQuestions(jobTitle: string, company: string, category: string, count: number = 10) {
    try {
      const prompt = `Generate ${count} ${category} interview questions for a ${jobTitle} position at ${company}.

For each question, provide:
1. The question itself
2. Category: ${category}
3. Difficulty level (beginner/intermediate/advanced)
4. 3-4 answer tips to help the candidate prepare

Categories:
- behavioral: Questions about past experiences, teamwork, leadership, problem-solving
- technical: Role-specific technical questions and coding challenges
- situational: Hypothetical scenarios and problem-solving questions
- company: Company-specific questions about culture, values, and industry knowledge

Format as JSON array:
{
  "questions": [
    {
      "question": "Tell me about a time you had to work with a difficult team member.",
      "category": "${category}",
      "difficulty": "intermediate",
      "tips": [
        "Focus on your actions and problem-solving approach",
        "Show emotional intelligence and professionalism",
        "Highlight the positive outcome or learning",
        "Avoid speaking negatively about others"
      ]
    }
  ]
}

Make questions specific to ${jobTitle} role and ${company} when possible.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert interview coach and hiring manager." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
      // Add unique IDs to questions
      const questions = (result.questions || []).map((q: any, index: number) => ({
        ...q,
        id: `q-${Date.now()}-${index}`
      }));
      return questions;
    } catch (error) {
      console.error("Interview questions generation error:", error);
      throw new Error("Failed to generate interview questions");
    }
  }

   async generatePrepResources(jobTitle: string, company: string, skills: string[] = []) {
    try {
      const prompt = `Generate relevant preparation resources for a ${jobTitle} interview at ${company}.

Focus on skills: ${skills.join(', ') || 'general interview skills'}

CRITICAL REQUIREMENT:
- Only use the verified resource URLs listed below.
- If no exact match exists, link to the platform's main catalog.
- NEVER invent or hallucinate URLs.

VERIFIED RESOURCE URLS:
- Coursera: https://www.coursera.org/
- Udemy: https://www.udemy.com/
- LinkedIn Learning: https://www.linkedin.com/learning/
- YouTube: https://www.youtube.com/
- LeetCode: https://leetcode.com/
- HackerRank: https://www.hackerrank.com/
- Khan Academy: https://www.khanacademy.org/
- Educative: https://www.educative.io/
- AWS Training: https://aws.amazon.com/training/digital/
- Azure Learning: https://learn.microsoft.com/en-us/training/
- Google Cloud Training: https://cloud.google.com/training

Provide 8–12 diverse, high-quality resources in this JSON structure:
{
  "resources": [
    {
      "title": "System Design Interview Prep",
      "type": "course",
      "url": "https://www.educative.io/courses/grokking-the-system-design-interview",
      "description": "Comprehensive system design patterns and interview questions",
      "duration": "8 hours",
      "provider": "Educative",
      "rating": 4.5
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a career coach who curates the best learning resources. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"resources": []}');

      // Post-process: enforce whitelist of allowed domains
      const allowedDomains = [
        "coursera.org",
        "udemy.com",
        "linkedin.com",
        "youtube.com",
        "leetcode.com",
        "hackerrank.com",
        "khanacademy.org",
        "educative.io",
        "aws.amazon.com",
        "cloud.google.com",
        "microsoft.com"
      ];

      const safeResources = (result.resources || []).map((r: any, index: number) => {
        const isAllowed = allowedDomains.some(domain => r.url && r.url.includes(domain));
        return {
          ...r,
          id: `r-${Date.now()}-${index}`,
          url: isAllowed ? r.url : "https://www.coursera.org/" // fallback safe URL
        };
      });

      return safeResources;
    } catch (error) {
      console.error("Prep resources generation error:", error);
      throw new Error("Failed to generate preparation resources");
    }
  }
} 

export const aiService = new AIService();
