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

      // Hash password and create admin user
      const hashedPassword = await hashPassword(password);

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

  const server = createServer(app);
  return server;
}
