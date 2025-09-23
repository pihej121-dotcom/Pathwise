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

// Helper functions
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function calculateStreak(activities: any[]): number {
  if (!activities || activities.length === 0) return 0;
  
  const today = new Date();
  let currentStreak = 0;
  
  for (let i = 0; i < 30; i++) {
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
  try {
    const existingAchievements = await storage.getUserAchievements(userId);
    const achievementTitles = existingAchievements.map(a => a.title);
    
    const resumes = await storage.getUserResumes(userId);
    const applications = await storage.getUserApplications(userId);
    const activities = await storage.getUserActivities(userId, 100);

    // First Resume Achievement
    if (resumes.length === 1 && !achievementTitles.includes("First Steps")) {
      await storage.createAchievement(
        userId,
        "First Steps",
        "Uploaded your first resume!",
        "📄"
      );
    }

    // Resume Milestones  
    if (resumes.length === 3 && !achievementTitles.includes("Resume Master")) {
      await storage.createAchievement(userId, "Resume Master", "Created 3 different resumes!", "📝");
    }

    // Job Application Milestones
    if (applications.length === 1 && !achievementTitles.includes("Job Hunter")) {
      await storage.createAchievement(userId, "Job Hunter", "Applied to your first job!", "🎯");
    }
    if (applications.length === 5 && !achievementTitles.includes("Persistent")) {
      await storage.createAchievement(userId, "Persistent", "Applied to 5 jobs!", "🏆");
    }
    if (applications.length === 10 && !achievementTitles.includes("Go-Getter")) {
      await storage.createAchievement(userId, "Go-Getter", "Applied to 10 jobs!", "⭐");
    }

    // Activity Streak Achievements
    const currentStreak = calculateStreak(activities);
    if (currentStreak >= 3 && !achievementTitles.includes("Consistent")) {
      await storage.createAchievement(userId, "Consistent", "3-day activity streak!", "🔥");
    }
    if (currentStreak >= 7 && !achievementTitles.includes("Dedicated")) {
      await storage.createAchievement(userId, "Dedicated", "7-day activity streak!", "🌟");
    }
    if (currentStreak >= 14 && !achievementTitles.includes("Committed")) {
      await storage.createAchievement(userId, "Committed", "14-day activity streak!", "💎");
    }
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, school, major, gradYear, invitationToken } = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.isActive) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      // If user exists but is deactivated, reactivate them
      if (existingUser && !existingUser.isActive) {
        const reactivatedUser = await storage.activateUser(existingUser.id);
        
        // Generate new session token
        const token = generateToken();
        await storage.createSession(reactivatedUser.id, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        
        return res.status(200).json({
          message: "User reactivated successfully",
          user: reactivatedUser,
          token
        });
      }

      // If invitation token provided, validate it
      let invitation = null;
      let institutionId = null;
      let userRole = "student";
      
      if (invitationToken) {
        invitation = await storage.getInvitationByToken(invitationToken);
        if (!invitation) {
          return res.status(400).json({ error: "Invalid or expired invitation" });
        }
        
        if (invitation.email !== email) {
          return res.status(400).json({ error: "Email does not match invitation" });
        }
        
        institutionId = invitation.institutionId;
        userRole = invitation.role;
        
        // Check seat availability for students
        if (userRole === "student") {
          const seatInfo = await storage.checkSeatAvailability(institutionId);
          if (!seatInfo.available) {
            return res.status(400).json({ 
              error: "No available seats. Please contact your administrator." 
            });
          }
        }
      } else {
        // No invitation - check if registration is open or domain-based
        const domain = email.split('@')[1];
        const institution = await storage.getInstitutionByDomain(domain);
        
        if (!institution) {
          return res.status(400).json({ 
            error: "Registration requires an invitation. Please contact your institution administrator." 
          });
        }
        
        institutionId = institution.id;
        
        // Check seat availability for domain-based registration
        const seatInfo = await storage.checkSeatAvailability(institutionId);
        if (!seatInfo.available) {
          return res.status(400).json({ 
            error: "No available seats. Please contact your administrator." 
          });
        }
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        institutionId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: userRole as any,
        school,
        major,
        gradYear,
        isActive: true,
        isVerified: true
      });

      // Claim invitation if provided
      if (invitation) {
        await storage.claimInvitation(invitationToken!, user.id);
      }
      
      // Update license seat usage for active students
      if (userRole === "student" && institutionId) {
        const license = await storage.getInstitutionLicense(institutionId);
        if (license && license.licenseType === "per_student") {
          await storage.updateLicenseUsage(license.id, license.usedSeats + 1);
          
          // Check if we need to send usage notification
          const seatInfo = await storage.checkSeatAvailability(institutionId);
          if (license.licensedSeats && seatInfo.usedSeats >= license.licensedSeats * 0.8) {
            const institution = await storage.getInstitution(institutionId);
            const adminUsers = await storage.getInstitutionUsers(institutionId);
            const admins = adminUsers.filter(u => u.role === "admin");
            
            // Send notification to admins
            for (const admin of admins) {
              await emailService.sendLicenseUsageNotification({
                adminEmail: admin.email,
                institutionName: institution?.name || "Unknown Institution",
                usedSeats: seatInfo.usedSeats,
                totalSeats: seatInfo.totalSeats || 0,
                usagePercentage: Math.round((seatInfo.usedSeats / (seatInfo.totalSeats || 1)) * 100)
              });
            }
          }
        }
      }
      
      console.log(`✅ User registered successfully: ${user.id} (${userRole}) for institution ${institutionId}`)
      
      // Create activity and check achievements
      await storage.createActivity(
        user.id,
        "account_created",
        "Welcome to Pathwise!",
        "Your account is ready to use."
      );
      await checkAndAwardAchievements(user.id);

      res.status(201).json({
        message: "Registration successful! You can now log in.",
        user: { ...user, password: undefined },
        requiresVerification: false
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

      const token = await createSession(user.id);
      
      // Set HTTP-only cookie for authentication
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      // Create login activity
      await storage.createActivity(user.id, "login", "Logged in", "User signed in to their account");
      await checkAndAwardAchievements(user.id);
      
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
      const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.auth_token;
      if (token) {
        await logout(token);
      }
      
      res.clearCookie('auth_token');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    res.json(req.user);
  });

  // Get user achievements
  app.get("/api/achievements", authenticate, async (req: AuthRequest, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.user!.id);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Admin setup route
  app.post("/api/admin/setup", async (req, res) => {
    try {
      const { institutionName, institutionDomain, firstName, lastName, email, password } = req.body;

      // Check if user already exists and is active
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.isActive) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Validate input
      if (!institutionName || !institutionDomain || !firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate domain format
      const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
      if (!domainRegex.test(institutionDomain)) {
        return res.status(400).json({ error: "Invalid domain format" });
      }

      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Check if institution domain already exists
      let institution = await storage.getInstitutionByDomain(institutionDomain);
      
      if (!institution) {
        // Create institution
        institution = await storage.createInstitution({
          name: institutionName,
          domain: institutionDomain,
          contactEmail: email,
          contactName: `${firstName} ${lastName}`,
          allowedDomains: [institutionDomain],
          isActive: true
        });

        // Create license for the institution
        await storage.createLicense({
          institutionId: institution.id,
          licenseType: "site",
          licensedSeats: null,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          brandingEnabled: true,
          supportLevel: "enterprise",
          isActive: true
        });
      }

      // Hash password and create admin user
      const hashedPassword = await hashPassword(password);
      const adminUser = await storage.createUser({
        institutionId: institution.id,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin",
        isVerified: true,
        isActive: true
      });

      res.json({ 
        success: true, 
        message: "Institution and admin account created successfully",
        institution: { 
          id: institution.id, 
          name: institution.name, 
          domain: institution.domain 
        },
        admin: { 
          id: adminUser.id, 
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName
        }
      });
    } catch (error) {
      console.error("Admin setup error:", error);
      res.status(500).json({ error: "Setup failed" });
    }
  });

  // Invitation routes
  app.post("/api/institutions/:id/invite", authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ error: "Only admins can send invitations" });
      }
      
      if (req.user!.role === "admin" && req.user!.institutionId !== req.params.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { email, role = "student" } = inviteUserSchema.parse({
        ...req.body,
        institutionId: req.params.id
      });
      
      // Check if user already exists and is active
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.isActive) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // If user exists but is deactivated, allow invitation
      if (existingUser && !existingUser.isActive) {
        console.log(`Sending invitation to previously deactivated user: ${email}`);
      }
      
      // Check seat availability for per-student licenses
      const seatInfo = await storage.checkSeatAvailability(req.params.id);
      if (!seatInfo.available && role === "student") {
        return res.status(400).json({ 
          error: "No available seats. Please upgrade your license or deactivate inactive users." 
        });
      }
      
      // Create invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const invitation = await storage.createInvitation({
        institutionId: req.params.id,
        email,
        role: role as any,
        invitedBy: req.user!.id,
        token,
        expiresAt
      });
      
      // Get institution details for email
      const institution = await storage.getInstitution(req.params.id);
      
      // Send invitation email
      const emailSent = await emailService.sendInvitation({
        email,
        token,
        institutionName: institution?.name || "Unknown Institution",
        inviterName: `${req.user!.firstName} ${req.user!.lastName}`,
        role
      });
      
      if (!emailSent) {
        console.warn("Failed to send invitation email - this is likely due to Resend requiring domain verification");
      }
      
      res.json({ 
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Resume routes
  app.post("/api/resumes", authenticate, async (req: AuthRequest, res) => {
    try {
      const { content, fileName, targetRole, targetIndustry, targetCompanies } = req.body;
      
      const resume = await storage.createResume({
        userId: req.user!.id,
        content,
        fileName,
        targetRole,
        targetIndustry,
        targetCompanies,
        isActive: true
      });

      // Create activity and check achievements
      await storage.createActivity(
        req.user!.id,
        "resume_upload",
        "Resume Uploaded",
        "Successfully uploaded and analyzed resume"
      );
      await checkAndAwardAchievements(req.user!.id);

      res.json(resume);
    } catch (error) {
      console.error("Resume creation error:", error);
      res.status(500).json({ error: "Failed to create resume" });
    }
  });

  // Application routes
  app.post("/api/applications", authenticate, async (req: AuthRequest, res) => {
    try {
      const { jobMatchId, position, company, applicationDate, status } = req.body;
      
      const application = await storage.createApplication({
        userId: req.user!.id,
        jobMatchId,
        position,
        company,
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        status: status || "applied"
      });

      // Create activity and check achievements
      await storage.createActivity(
        req.user!.id,
        "job_application",
        "Job Application",
        `Applied to ${position} at ${company}`
      );
      await checkAndAwardAchievements(req.user!.id);

      res.json(application);
    } catch (error) {
      console.error("Application creation error:", error);
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticate, async (req: AuthRequest, res) => {
    try {
      const activities = await storage.getUserActivities(req.user!.id, 100);
      const resumes = await storage.getUserResumes(req.user!.id);
      const applications = await storage.getUserApplications(req.user!.id);
      const achievements = await storage.getUserAchievements(req.user!.id);

      // Calculate streak
      const streak = calculateStreak(activities);

      const stats = {
        totalResumes: resumes.length,
        totalApplications: applications.length,
        totalAchievements: achievements.length,
        streak: streak,
        recentActivities: activities.slice(0, 10)
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Activities
  app.get("/api/activities", authenticate, async (req: AuthRequest, res) => {
    try {
      const activities = await storage.getUserActivities(req.user!.id, 50);
      res.json(activities);
    } catch (error) {
      console.error("Activities fetch error:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  const server = createServer(app);
  return server;
}
      
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

  // Get user achievements
  app.get("/api/achievements", authenticate, async (req: AuthRequest, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.user!.id);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
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

      // Calculate dynamic stats
      const rmsScoreImprovement = activeResume?.rmsScore ? 
        Math.max(0, (activeResume.rmsScore - 45)) : 0; // Improvement from baseline
      
      const applicationStats = {
        total: applications.length,
        pending: applications.filter(app => app.status === "applied").length,
        interviewing: applications.filter(app => ["interview_scheduled", "interviewed"].includes(app.status)).length,
        rejected: applications.filter(app => app.status === "rejected").length,
        offers: applications.filter(app => app.status === "offered").length
      };

      // Calculate actual streak from activities
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
          break; // Break streak if no activity found (but not for today)
        }
      }

      // Get current active roadmap phase
      const activeRoadmap = roadmaps.find(r => r.isActive === true) || roadmaps[0];
      // Phase title mapping to match Career Roadmap
      const phaseLabels = {
        '30_days': '30-Day Career Advancement Plan',
        '3_months': '3-Month Foundation Building',
        '6_months': '6-Month Career Transformation'
      };
      
      const currentPhase = activeRoadmap ? {
        title: activeRoadmap.title || phaseLabels[activeRoadmap.phase as keyof typeof phaseLabels] || '30-Day Career Advancement Plan',
        progress: activeRoadmap.progress || 0,
        phase: activeRoadmap.phase || '30_days'
      } : null;

      // Get AI insights from actual resume analysis
      const aiInsights = activeResume?.gaps && Array.isArray(activeResume.gaps) ? {
        topRecommendations: [...activeResume.gaps] // Create copy to avoid mutation
          .map((gap: any) => ({
            // Normalize the gap data structure
            category: gap.category || 'General Improvement',
            rationale: gap.rationale || gap.recommendation || gap.description || 'No details provided',
            priority: (gap.priority || 'medium').toLowerCase(),
            impact: Number(gap.impact) || 0
          }))
          .sort((a: any, b: any) => {
            // Prioritize by impact and priority (same logic as Resume Analysis)
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            const aScore = (priorityWeight[a.priority as keyof typeof priorityWeight] || 1) * (a.impact || 0);
            const bScore = (priorityWeight[b.priority as keyof typeof priorityWeight] || 1) * (b.impact || 0);
            return bScore - aScore;
          })
          .slice(0, 2) // Get top 2 recommendations
      } : null;

      // Get actual roadmap tasks for dashboard display
      const currentRoadmapTasks = activeRoadmap && activeRoadmap.subsections ? 
        (activeRoadmap.subsections as any[]).flatMap(subsection => 
          (subsection.tasks || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.completed ? 'completed' : 'pending',
            completed: task.completed,
            priority: task.priority || 'medium',
            dueDate: task.dueDate,
            icon: task.icon || 'clock'
          }))
        ).slice(0, 3) // Show top 3 tasks on dashboard
      : [];

      const stats = {
        rmsScore: activeResume?.rmsScore || 0,
        rmsScoreImprovement,
        applicationsCount: applications.length,
        pendingApplications: applicationStats.pending,
        interviewingCount: applicationStats.interviewing,
        applicationStats,
        roadmapProgress: roadmaps.length > 0 ? 
          Math.round(roadmaps.reduce((sum, r) => sum + (r.progress || 0), 0) / roadmaps.length) : 0,
        currentPhase,
        currentRoadmapTasks,
        achievementsCount: achievements.length,
        recentActivities: activities,
        topJobMatches: jobMatches.slice(0, 5),
        streak: Math.max(1, currentStreak),
        totalActivities: activities.length,
        aiInsights,
        weeklyProgress: {
          applicationsThisWeek: applications.filter(app => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(app.appliedDate) > weekAgo;
          }).length,
          activitiesThisWeek: activities.filter(activity => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(activity.createdAt) > weekAgo;
          }).length
        }
      };

      // Update user session with streak info for display in header
      if ((req as any).user) {
        (req as any).user.streak = stats.streak;
        (req as any).user.unreadNotifications = Math.min(9, stats.totalActivities); // Cap at 9 for UI
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Interview prep routes
  app.post("/api/interview-prep/generate-questions", authenticate, async (req: AuthRequest, res) => {
    try {
      const { applicationId, category, count = 10 } = req.body;
      
      if (!applicationId || !category) {
        return res.status(400).json({ error: "Application ID and category are required" });
      }

      // Get the application details to extract job info
      const applications = await storage.getUserApplications(req.user!.id);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const questions = await aiService.generateInterviewQuestions(
        application.position,
        application.company,
        category,
        count
      );

      res.json(questions);
    } catch (error) {
      console.error("Generate interview questions error:", error);
      res.status(500).json({ error: "Failed to generate interview questions" });
    }
  });

  app.get("/api/interview-prep/questions", authenticate, async (req: AuthRequest, res) => {
    try {
      const { applicationId, category } = req.query;
      
      if (!applicationId) {
        return res.status(400).json({ error: "Application ID is required" });
      }

      // Get the application details
      const applications = await storage.getUserApplications(req.user!.id);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // For now, return empty array - questions are generated on demand
      // In a real implementation, you might want to store generated questions
      res.json([]);
    } catch (error) {
      console.error("Get interview questions error:", error);
      res.status(500).json({ error: "Failed to get interview questions" });
    }
  });

  app.get("/api/interview-prep/resources", authenticate, async (req: AuthRequest, res) => {
    try {
      const { applicationId } = req.query;
      
      if (!applicationId) {
        return res.status(400).json({ error: "Application ID is required" });
      }

      // Get the application details
      const applications = await storage.getUserApplications(req.user!.id);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Extract skills from job match requirements or use defaults based on position
      let skills: string[] = [];
      if (application.jobMatchId) {
        try {
          const jobMatches = await storage.getUserJobMatches(req.user!.id);
          const jobMatch = jobMatches.find(jm => jm.id === application.jobMatchId);
          if (jobMatch && jobMatch.requirements) {
            // Extract basic skills from requirements text
            const commonSkills = ['JavaScript', 'Python', 'SQL', 'React', 'Node.js', 'AWS', 'Docker', 'Git'];
            skills = commonSkills.filter(skill => 
              jobMatch.requirements?.toLowerCase().includes(skill.toLowerCase())
            );
          }
        } catch (error) {
          console.error('Error fetching job match for skills:', error);
        }
      }
      
      // Call OpenAI to generate resources
      console.log(`Generating resources for ${application.position} at ${application.company} with skills:`, skills);
      const resources = await aiService.generatePrepResources(
        application.position,
        application.company,
        skills
      );
      console.log('OpenAI returned resources:', JSON.stringify(resources, null, 2));

      res.json(resources);
    } catch (error) {
      console.error("Get prep resources error:", error);
      res.status(500).json({ error: "Failed to get preparation resources" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
