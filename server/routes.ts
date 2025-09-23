import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, requireAdmin, hashPassword, verifyPassword, createSession, logout, type AuthRequest } from "./auth";
import { aiService } from "./ai";
import { jobsService } from "./jobs";
import { ObjectStorageService } from "./objectStorage";
import { emailService } from "./email";
import { 
  loginSchema, 
  registerSchema, 
  insertInstitutionSchema, 
  insertLicenseSchema, 
  inviteUserSchema, 
  verifyEmailSchema 
} from "@shared/schema";
import crypto from "crypto";
import { fromZodError } from "zod-validation-error";
import PDFParse from "pdf-parse";
import { Document, Packer, Paragraph, TextRun } from "docx";

//
// 🔹 Achievement helpers
//
function calculateStreak(activities: any[]): number {
  const today = new Date();
  let currentStreak = 0;
  const recentDays = 30;

  for (let i = 0; i < recentDays; i++) {
    const dayToCheck = new Date(today);
    dayToCheck.setDate(today.getDate() - i);
    const dayStart = new Date(dayToCheck.setHours(0, 0, 0, 0));
    const dayEnd = new Date(dayToCheck.setHours(23, 59, 59, 999));

    const hasActivity = activities.some(activity => {
      const activityDate = new Date(activity.createdAt);
      return activityDate >= dayStart && activityDate <= dayEnd;
    });

    if (hasActivity) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  return currentStreak;
}

async function checkAndAwardAchievements(userId: string) {
  const user = await storage.getUser(userId);
  const activities = await storage.getUserActivities(userId, 100);
  const resumes = await storage.getUserResumes(userId);
  const applications = await storage.getUserApplications(userId);

  // First Resume Achievement
  if (resumes.length === 1) {
    await storage.createAchievement(
      userId,
      "First Steps",
      "Uploaded your first resume!",
      "📄"
    );
  }

  // Job Application Milestones
  if (applications.length === 1) {
    await storage.createAchievement(userId, "Job Hunter", "Applied to your first job!", "🎯");
  }
  if (applications.length === 10) {
    await storage.createAchievement(userId, "Persistent", "Applied to 10 jobs!", "🏆");
  }

  // Activity Streak Achievements
  const currentStreak = calculateStreak(activities);
  if (currentStreak === 7) {
    await storage.createAchievement(userId, "Consistent", "7-day streak!", "🔥");
  }
  if (currentStreak === 30) {
    await storage.createAchievement(userId, "Dedicated", "30-day streak!", "⭐");
  }
}

//
// 🔹 Main routes
//
export async function registerRoutes(app: Express): Promise<Server> {
  // … existing auth/admin/institution routes remain unchanged …

  // Resume routes
  app.post("/api/resumes", authenticate, async (req: AuthRequest, res) => {
    try {
      const { fileName, filePath, extractedText, targetRole, targetIndustry, targetCompanies } = req.body;
      if (!extractedText) return res.status(400).json({ error: "extractedText is required" });
      if (!targetRole) return res.status(400).json({ error: "targetRole is required" });

      const resume = await storage.createResume({
        userId: req.user!.id,
        fileName: fileName || "resume.txt",
        filePath: filePath || "/text-input",
        extractedText,
      });

      if (extractedText) {
        try {
          const analysis = await aiService.analyzeResume(extractedText, targetRole, targetIndustry, targetCompanies);
          await storage.updateResumeAnalysis(resume.id, { ...analysis });

          await storage.createActivity(
            req.user!.id,
            "resume_analyzed",
            "Resume Analysis Complete",
            `Your resume scored ${analysis.rmsScore}/100`
          );
          await checkAndAwardAchievements(req.user!.id); // ✅ added
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
        }
      }

      res.status(201).json(resume);
    } catch (error) {
      console.error("Resume creation error:", error);
      res.status(500).json({ error: "Failed to create resume" });
    }
  });

  // Roadmaps
  app.post("/api/roadmaps/generate", authenticate, async (req: AuthRequest, res) => {
    try {
      const { phase } = req.body;
      if (!["30_days", "3_months", "6_months"].includes(phase)) return res.status(400).json({ error: "Invalid phase" });

      const activeResume = await storage.getActiveResume(req.user!.id);
      const resumeAnalysis = activeResume?.gaps ? { ...activeResume } : undefined;

      const roadmapData = await aiService.generateCareerRoadmap(phase, req.user!, resumeAnalysis);
      const roadmap = await storage.createRoadmap({
        userId: req.user!.id,
        phase,
        title: roadmapData.title,
        description: roadmapData.description,
        actions: roadmapData.actions,
      });

      await storage.createActivity(
        req.user!.id,
        "roadmap_generated",
        `${roadmapData.title} Created`,
        `Your ${phase.replace("_", "-")} roadmap is ready`
      );
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.status(201).json(roadmap);
    } catch (error) {
      console.error("Roadmap generation error:", error);
      res.status(500).json({ error: "Failed to generate roadmap" });
    }
  });

  // Applications
  app.post("/api/applications", authenticate, async (req: AuthRequest, res) => {
    try {
      const applicationData = req.body;
      const processedData = {
        ...applicationData,
        userId: req.user!.id,
        appliedDate: applicationData.appliedDate ? new Date(applicationData.appliedDate) : new Date(),
      };

      const application = await storage.createApplication(processedData);

      await storage.createActivity(
        req.user!.id,
        "application_submitted",
        "Application Submitted",
        `Applied to ${application.company} for ${application.position}`
      );
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.status(201).json(application);
    } catch (error) {
      console.error("Create application error:", error);
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  // Resume Tailoring
  app.post("/api/jobs/tailor-resume", authenticate, async (req: AuthRequest, res) => {
    try {
      const { jobData, baseResumeId } = req.body;
      if (!jobData) return res.status(400).json({ error: "Job data is required" });

      const resume = baseResumeId 
        ? (await storage.getUserResumes(req.user!.id)).find(r => r?.id === baseResumeId)
        : await storage.getActiveResume(req.user!.id);
      if (!resume?.extractedText) return res.status(400).json({ error: "Resume text not available" });

      const tailoredResult = await aiService.tailorResume(resume.extractedText, jobData.description || "", [], req.user!);
      const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun(tailoredResult.tailoredContent)] })] }] });
      const docxBuffer = await Packer.toBuffer(doc);

      const jobMatch = await storage.createJobMatch({ userId: req.user!.id, title: jobData.title, company: jobData.company?.display_name || "Company" });
      const tailoredResumeRecord = await storage.createTailoredResume({ userId: req.user!.id, baseResumeId: resume.id, jobMatchId: jobMatch.id, ...tailoredResult });

      await storage.createActivity(
        req.user!.id,
        "resume_tailored",
        "Resume Tailored",
        `Resume optimized for ${jobData.company?.display_name || 'Company'} - ${jobData.title}`
      );
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.status(201).json({ id: tailoredResumeRecord.id, jobMatchId: jobMatch.id, tailoredContent: tailoredResult.tailoredContent, docxBuffer: docxBuffer.toString("base64") });
    } catch (error) {
      console.error("Resume tailoring error:", error);
      res.status(500).json({ error: "Failed to tailor resume" });
    }
  });

  // Copilot Resume Update
  app.post("/api/copilot/update-resume-from-roadmap", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const resume = await storage.getActiveResume(userId);
      if (!resume?.extractedText) return res.status(400).json({ error: "Resume required" });

      const roadmaps = await storage.getUserRoadmaps(userId);
      const completedTasks = roadmaps.filter(r => r.progress === 100);
      if (completedTasks.length === 0) return res.status(400).json({ error: "No completed tasks" });

      const updatedResume = await aiService.updateResumeFromRoadmap({ resumeText: resume.extractedText, completedTasks });
      await storage.createActivity(userId, "resume_updated", "Resume Updated", "Your resume was auto-updated from completed roadmap tasks");
      await checkAndAwardAchievements(userId); // ✅ added

      res.json(updatedResume);
    } catch (error) {
      console.error("Error updating resume:", error);
      res.status(500).json({ error: "Failed to update resume" });
    }
  });

  // Cover Letter
  app.post("/api/copilot/cover-letter", authenticate, async (req: AuthRequest, res) => {
    try {
      const { jobTitle, company, jobDescription, resumeText } = req.body;
      const coverLetter = await aiService.generateCoverLetter(resumeText, jobDescription, company, jobTitle);

      await storage.createActivity(req.user!.id, "cover_letter_generated", "Cover Letter Ready", `Cover letter drafted for ${company} - ${jobTitle}`);
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.json({ coverLetter });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({ error: "Failed to generate cover letter" });
    }
  });

  app.post("/api/ai/cover-letter", authenticate, async (req: AuthRequest, res) => {
    try {
      const { jobDescription, company, role } = req.body;
      const activeResume = await storage.getActiveResume(req.user!.id);
      const coverLetter = await aiService.generateCoverLetter(activeResume!.extractedText, jobDescription, company, role);

      await storage.createActivity(req.user!.id, "cover_letter_generated", "Cover Letter Ready", `Cover letter drafted for ${company} - ${role}`);
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.json({ coverLetter });
    } catch (error) {
      console.error("Cover letter generation error:", error);
      res.status(500).json({ error: "Failed to generate cover letter" });
    }
  });

  // Salary Negotiation
  app.post("/api/copilot/salary-negotiation", authenticate, async (req: AuthRequest, res) => {
    try {
      const { currentSalary, targetSalary, jobRole, location, yearsExperience } = req.body;
      const resume = await storage.getActiveResume(req.user!.id);
      const negotiationStrategy = await aiService.generateSalaryNegotiationStrategy({ currentSalary, targetSalary, jobRole, location, yearsExperience, resumeText: resume!.extractedText });

      await storage.createActivity(req.user!.id, "salary_strategy_generated", "Salary Negotiation Plan Ready", `Negotiation plan created for ${jobRole}`);
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.json({ strategy: negotiationStrategy });
    } catch (error) {
      console.error("Error generating salary negotiation strategy:", error);
      res.status(500).json({ error: "Failed to generate salary negotiation strategy" });
    }
  });

  // Interview Prep (optional achievements)
  app.post("/api/interview-prep/generate-questions", authenticate, async (req: AuthRequest, res) => {
    try {
      const { applicationId, category, count = 10 } = req.body;
      const applications = await storage.getUserApplications(req.user!.id);
      const application = applications.find(app => app.id === applicationId);
      const questions = await aiService.generateInterviewQuestions(application!.position, application!.company, category, count);

      await storage.createActivity(req.user!.id, "interview_questions_generated", "Interview Prep", `Generated ${count} ${category} questions for ${application!.position}`);
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.json(questions);
    } catch (error) {
      console.error("Generate interview questions error:", error);
      res.status(500).json({ error: "Failed to generate interview questions" });
    }
  });

  app.get("/api/interview-prep/resources", authenticate, async (req: AuthRequest, res) => {
    try {
      const { applicationId } = req.query;
      const applications = await storage.getUserApplications(req.user!.id);
      const application = applications.find(app => app.id === applicationId);
      const resources = await aiService.generatePrepResources(application!.position, application!.company, []);

      await storage.createActivity(req.user!.id, "interview_resources_generated", "Prep Resources Ready", `Resources generated for ${application!.position} at ${application!.company}`);
      await checkAndAwardAchievements(req.user!.id); // ✅ added

      res.json(resources);
    } catch (error) {
      console.error("Get prep resources error:", error);
      res.status(500).json({ error: "Failed to get preparation resources" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
