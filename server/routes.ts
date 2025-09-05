import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, requireAdmin, hashPassword, verifyPassword, createSession, logout, type AuthRequest } from "./auth";
import { aiService } from "./ai";
import { jobsService } from "./jobs";
import { ObjectStorageService } from "./objectStorage";
import { loginSchema, registerSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import PDFParse from "pdf-parse";
import { Document, Packer, Paragraph, TextRun } from "docx";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const { confirmPassword, ...userData } = validatedData;
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create session
      const token = await createSession(user.id);
      
      // Create activity
      await storage.createActivity(
        user.id,
        "account_created",
        "Welcome to Pathwise!",
        "Your career journey begins now"
      );

      res.status(201).json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Temporarily disabled for development - email verification not implemented yet
      // if (!user.isVerified) {
      //   return res.status(401).json({ error: "Please verify your email first" });
      // }

      const token = await createSession(user.id);
      
      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticate, async (req: AuthRequest, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        await logout(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    res.json({ user: { ...req.user!, password: undefined } });
  });

  // Resume routes
  app.post("/api/resumes/upload", authenticate, async (req: AuthRequest, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Resume upload URL error:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/resumes", authenticate, async (req: AuthRequest, res) => {
    try {
      const { fileName, filePath, extractedText, targetRole, targetIndustry, targetCompanies } = req.body;
      
      if (!extractedText) {
        return res.status(400).json({ error: "extractedText is required" });
      }
      
      if (!targetRole) {
        return res.status(400).json({ error: "targetRole is required" });
      }

      // Create resume record with the provided text
      const resume = await storage.createResume({
        userId: req.user!.id,
        fileName: fileName || "resume.txt",
        filePath: filePath || "/text-input",
        extractedText,
      });

      // Trigger AI analysis with target role
      if (extractedText) {
        try {
          const analysis = await aiService.analyzeResume(
            extractedText,
            targetRole,
            targetIndustry,
            targetCompanies
          );
          
          console.log("AI Analysis Response:", JSON.stringify(analysis, null, 2));
          
          await storage.updateResumeAnalysis(resume.id, {
            rmsScore: analysis.rmsScore,
            skillsScore: analysis.skillsScore,
            experienceScore: analysis.experienceScore,
            keywordsScore: analysis.keywordsScore,
            educationScore: analysis.educationScore,
            certificationsScore: analysis.certificationsScore,
            gaps: analysis.gaps
          });

          // Create activity
          await storage.createActivity(
            req.user!.id,
            "resume_analyzed",
            "Resume Analysis Complete",
            `Your resume scored ${analysis.rmsScore}/100`
          );
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
          // Continue without analysis for now
        }
      }

      res.status(201).json(resume);
    } catch (error) {
      console.error("Resume creation error:", error);
      res.status(500).json({ error: "Failed to create resume" });
    }
  });

  app.get("/api/resumes", authenticate, async (req: AuthRequest, res) => {
    try {
      const resumes = await storage.getUserResumes(req.user!.id);
      res.json(resumes);
    } catch (error) {
      console.error("Get resumes error:", error);
      res.status(500).json({ error: "Failed to get resumes" });
    }
  });

  app.get("/api/resumes/active", authenticate, async (req: AuthRequest, res) => {
    try {
      const resume = await storage.getActiveResume(req.user!.id);
      res.json(resume || null);
    } catch (error) {
      console.error("Get active resume error:", error);
      res.status(500).json({ error: "Failed to get active resume" });
    }
  });

  // Career roadmap routes
  app.post("/api/roadmaps/generate", authenticate, async (req: AuthRequest, res) => {
    try {
      const { phase } = req.body;
      
      if (!["30_days", "3_months", "6_months"].includes(phase)) {
        return res.status(400).json({ error: "Invalid phase" });
      }

      // Get user's resume analysis for context
      const activeResume = await storage.getActiveResume(req.user!.id);
      let resumeAnalysis;
      
      if (activeResume?.gaps) {
        resumeAnalysis = {
          rmsScore: activeResume.rmsScore || 0,
          skillsScore: activeResume.skillsScore || 0,
          experienceScore: activeResume.experienceScore || 0,
          keywordsScore: activeResume.keywordsScore || 0,
          educationScore: activeResume.educationScore || 0,
          certificationsScore: activeResume.certificationsScore || 0,
          gaps: activeResume.gaps
        };
      }

      const roadmapData = await aiService.generateCareerRoadmap(
        phase,
        req.user!,
        resumeAnalysis
      );

      const roadmap = await storage.createRoadmap({
        userId: req.user!.id,
        phase,
        title: roadmapData.title,
        description: roadmapData.description,
        actions: roadmapData.actions,
      });

      // Create activity
      await storage.createActivity(
        req.user!.id,
        "roadmap_generated",
        `${roadmapData.title} Created`,
        `Your ${phase.replace("_", "-")} roadmap is ready`
      );

      res.status(201).json(roadmap);
    } catch (error) {
      console.error("Roadmap generation error:", error);
      res.status(500).json({ error: "Failed to generate roadmap" });
    }
  });

  app.get("/api/roadmaps", authenticate, async (req: AuthRequest, res) => {
    try {
      const roadmaps = await storage.getUserRoadmaps(req.user!.id);
      res.json(roadmaps);
    } catch (error) {
      console.error("Get roadmaps error:", error);
      res.status(500).json({ error: "Failed to get roadmaps" });
    }
  });

  app.put("/api/roadmaps/:id/progress", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      
      if (typeof progress !== "number" || progress < 0 || progress > 100) {
        return res.status(400).json({ error: "Progress must be between 0 and 100" });
      }

      const roadmap = await storage.updateRoadmapProgress(id, progress);
      res.json(roadmap);
    } catch (error) {
      console.error("Update roadmap progress error:", error);
      res.status(500).json({ error: "Failed to update roadmap progress" });
    }
  });

  // Job matching routes
  app.get("/api/jobs/search", authenticate, async (req: AuthRequest, res) => {
    try {
      const {
        query = req.user!.targetRole || "software engineer",
        location = req.user!.location || "United States",
        page = "1",
        limit = "20"
      } = req.query;

      console.log("Job search params:", { query, location, page, limit });

      const jobsData = await jobsService.searchJobs({
        query: query as string,
        location: location as string,
        page: parseInt(page as string),
        resultsPerPage: parseInt(limit as string),
      });

      console.log("Jobs found:", jobsData.jobs.length);

      // Get user's active resume for compatibility scoring
      const activeResume = await storage.getActiveResume(req.user!.id);
      
      const enhancedJobs = [];
      
      for (const job of jobsData.jobs) {
        let jobMatch;
        
        if (activeResume?.extractedText) {
          try {
            const analysis = await aiService.analyzeJobMatch(
              job.description,
              activeResume.extractedText,
              req.user!
            );
            
            jobMatch = await storage.createJobMatch({
              userId: req.user!.id,
              externalJobId: job.id,
              title: job.title,
              company: job.company.display_name,
              location: job.location.display_name,
              description: job.description,
              salary: job.salary_min && job.salary_max 
                ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                : undefined,
              compatibilityScore: analysis.compatibilityScore,
              matchReasons: analysis.matchReasons,
              skillsGaps: analysis.skillsGaps,
              resourceLinks: analysis.resourceLinks,
            });
          } catch (analysisError) {
            console.error("Job analysis error:", analysisError);
            // Create basic job match without AI analysis
            jobMatch = await storage.createJobMatch({
              userId: req.user!.id,
              externalJobId: job.id,
              title: job.title,
              company: job.company.display_name,
              location: job.location.display_name,
              description: job.description,
              compatibilityScore: 75, // Default score
              matchReasons: ["Matches your target role"],
              skillsGaps: [],
              resourceLinks: [],
            });
          }
        }
        
        enhancedJobs.push(jobMatch || {
          externalJobId: job.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          description: job.description,
          compatibilityScore: 75,
          matchReasons: ["Matches your search criteria"],
          skillsGaps: [],
        });
      }

      res.json({
        jobs: enhancedJobs,
        totalCount: jobsData.totalCount,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
    } catch (error) {
      console.error("Job search error:", error);
      res.status(500).json({ error: "Failed to search jobs" });
    }
  });

  app.get("/api/jobs/matches", authenticate, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const jobMatches = await storage.getUserJobMatches(req.user!.id, limit);
      res.json(jobMatches);
    } catch (error) {
      console.error("Get job matches error:", error);
      res.status(500).json({ error: "Failed to get job matches" });
    }
  });

  app.post("/api/jobs/:id/tailor-resume", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id: jobMatchId } = req.params;
      const { baseResumeId } = req.body;
      
      // Get job match and base resume
      const [jobMatches, baseResume] = await Promise.all([
        storage.getUserJobMatches(req.user!.id),
        baseResumeId ? storage.getUserResumes(req.user!.id) : [await storage.getActiveResume(req.user!.id)]
      ]);
      
      const jobMatch = jobMatches.find(j => j.id === jobMatchId);
      const resume = baseResumeId 
        ? baseResume.find(r => r?.id === baseResumeId)
        : baseResume[0];
        
      if (!jobMatch) {
        return res.status(404).json({ error: "Job match not found" });
      }
      
      if (!resume?.extractedText) {
        return res.status(400).json({ error: "Resume text not available" });
      }

      // Extract keywords from job description
      const targetKeywords = jobMatch.description
        ?.split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 20) || [];

      const tailoredResult = await aiService.tailorResume(
        resume.extractedText,
        jobMatch.description || "",
        targetKeywords,
        req.user!
      );

      // Generate DOCX file
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(tailoredResult.tailoredContent)],
            }),
          ],
        }],
      });

      const docxBuffer = await Packer.toBuffer(doc);
      
      // TODO: Save files to S3 and get paths
      const docxPath = `/objects/tailored-resumes/${jobMatchId}-${Date.now()}.docx`;
      const pdfPath = `/objects/tailored-resumes/${jobMatchId}-${Date.now()}.pdf`;

      // Create tailored resume record
      const tailoredResume = await storage.createTailoredResume({
        userId: req.user!.id,
        baseResumeId: resume.id,
        jobMatchId,
        tailoredContent: tailoredResult.tailoredContent,
        diffJson: tailoredResult.diffJson,
        jobSpecificScore: tailoredResult.jobSpecificScore,
        keywordsCovered: tailoredResult.keywordsCovered,
        remainingGaps: tailoredResult.remainingGaps,
        docxPath,
        pdfPath,
      });

      // Create activity
      await storage.createActivity(
        req.user!.id,
        "resume_tailored",
        "Resume Tailored",
        `Resume optimized for ${jobMatch.company} - ${jobMatch.title}`
      );

      res.status(201).json({
        ...tailoredResume,
        analysis: tailoredResult,
      });
    } catch (error) {
      console.error("Resume tailoring error:", error);
      res.status(500).json({ error: "Failed to tailor resume" });
    }
  });

  // Applications routes
  app.post("/api/applications", authenticate, async (req: AuthRequest, res) => {
    try {
      const applicationData = req.body;
      
      const application = await storage.createApplication({
        ...applicationData,
        userId: req.user!.id,
      });

      // Create activity
      await storage.createActivity(
        req.user!.id,
        "application_submitted",
        "Application Submitted",
        `Applied to ${application.company} for ${application.position}`
      );

      res.status(201).json(application);
    } catch (error) {
      console.error("Create application error:", error);
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  app.get("/api/applications", authenticate, async (req: AuthRequest, res) => {
    try {
      const applications = await storage.getUserApplications(req.user!.id);
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ error: "Failed to get applications" });
    }
  });

  app.put("/api/applications/:id/status", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status, responseDate } = req.body;
      
      const application = await storage.updateApplicationStatus(
        id, 
        status, 
        responseDate ? new Date(responseDate) : undefined
      );
      
      res.json(application);
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(500).json({ error: "Failed to update application status" });
    }
  });

  // AI Co-pilot routes
  app.post("/api/ai/cover-letter", authenticate, async (req: AuthRequest, res) => {
    try {
      const { jobDescription, company, role } = req.body;
      
      const activeResume = await storage.getActiveResume(req.user!.id);
      if (!activeResume?.extractedText) {
        return res.status(400).json({ error: "No active resume found" });
      }

      const coverLetter = await aiService.generateCoverLetter(
        activeResume.extractedText,
        jobDescription,
        company,
        role
      );

      res.json({ coverLetter });
    } catch (error) {
      console.error("Cover letter generation error:", error);
      res.status(500).json({ error: "Failed to generate cover letter" });
    }
  });

  app.post("/api/ai/linkedin-optimize", authenticate, async (req: AuthRequest, res) => {
    try {
      const { currentProfile } = req.body;
      
      const optimization = await aiService.optimizeLinkedInProfile(
        currentProfile,
        req.user!.targetRole || "Professional",
        req.user!.industries || []
      );

      res.json(optimization);
    } catch (error) {
      console.error("LinkedIn optimization error:", error);
      res.status(500).json({ error: "Failed to optimize LinkedIn profile" });
    }
  });

  // Activities and achievements
  app.get("/api/activities", authenticate, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getUserActivities(req.user!.id, limit);
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ error: "Failed to get activities" });
    }
  });

  app.get("/api/achievements", authenticate, async (req: AuthRequest, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.user!.id);
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Failed to get achievements" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticate, async (req: AuthRequest, res) => {
    try {
      const [
        activeResume,
        applications,
        roadmaps,
        achievements,
        activities,
        jobMatches
      ] = await Promise.all([
        storage.getActiveResume(req.user!.id),
        storage.getUserApplications(req.user!.id),
        storage.getUserRoadmaps(req.user!.id),
        storage.getUserAchievements(req.user!.id),
        storage.getUserActivities(req.user!.id, 5),
        storage.getUserJobMatches(req.user!.id, 10)
      ]);

      const stats = {
        rmsScore: activeResume?.rmsScore || 0,
        applicationsCount: applications.length,
        pendingApplications: applications.filter(app => app.status === "applied").length,
        roadmapProgress: roadmaps.length > 0 ? 
          Math.round(roadmaps.reduce((sum, r) => sum + (r.progress || 0), 0) / roadmaps.length) : 0,
        achievementsCount: achievements.length,
        recentActivities: activities,
        topJobMatches: jobMatches.slice(0, 5),
        streak: 7, // TODO: Calculate actual streak
      };

      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
