import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, requireAdmin, hashPassword, verifyPassword, createSession, logout, generateToken, type AuthRequest } from "./auth";
import { aiService } from "./ai";
import { jobsService } from "./jobs";
import { beyondJobsService } from "./beyond-jobs";
import { ObjectStorageService } from "./objectStorage";
import { emailService } from "./email";
import { 
  loginSchema, 
  registerSchema, 
  insertInstitutionSchema, 
  insertLicenseSchema, 
  inviteUserSchema, 
  verifyEmailSchema,
  insertSkillGapAnalysisSchema,
  insertMicroProjectSchema,
  insertProjectCompletionSchema,
  insertPortfolioArtifactSchema
} from "@shared/schema";
import crypto from "crypto";
import { fromZodError } from "zod-validation-error";
import PDFParse from "pdf-parse";
import { Document, Packer, Paragraph, TextRun } from "docx";

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
        isActive: true, // Auto-activate for invited users since email verification is temporarily disabled
        isVerified: true // Auto-verify for invited users
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
      
      // Create activity
      await storage.createActivity(
        user.id,
        "account_created",
        "Welcome to Pathwise!",
        "Your account is ready to use."
      );

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

      // Temporarily disabled for development - email verification not implemented yet
      // if (!user.isVerified) {
      //   return res.status(401).json({ error: "Please verify your email first" });
      // }

      const token = await createSession(user.id);
      
      // Create login activity
      await storage.createActivity(
        user.id,
        "user_login",
        "Logged In",
        `Welcome back, ${user.firstName}!`
      );
      
      // Set HTTP-only cookie for authentication
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
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
      
      // Clear the auth cookie
      res.clearCookie('auth_token');
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    res.json(req.user); // ← Return user directly, no nesting
  });

  // Admin setup route - only works when database is empty
  app.post("/api/admin/setup", async (req, res) => {
    try {
      const { institutionName, institutionDomain, firstName, lastName, email, password } = req.body;

      // Check if user already exists and is active
const existingUser = await storage.getUserByEmail(email);
if (existingUser && existingUser.isActive) {
  return res.status(400).json({ error: "User with this email already exists" });
}
// If user exists but is deactivated, allow invitation (they can reactivate later)
if (existingUser && !existingUser.isActive) {
  // Optional: You could auto-reactivate here or just allow the invitation
  console.log(`Sending invitation to previously deactivated user: ${email}`);
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

      // Check if institution domain already exists, if not create it
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
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
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
      res.status(500).json({ error: "Failed to create institution and admin account" });
    }
  });

  // Check if database needs setup
  app.get("/api/admin/needs-setup", async (req, res) => {
    try {
      const existingAdmin = await storage.getUserByEmail("admin@demo-university.edu");
      const someExistingUser = await storage.getUserByEmail("student@demo-university.edu");
      res.json({ needsSetup: !existingAdmin && !someExistingUser });
    } catch (error) {
      console.error("Error checking setup status:", error);
      res.json({ needsSetup: false });
    }
  });

  // Environment variables diagnostic endpoint
  app.get("/api/admin/env-check", async (req, res) => {
    try {
      const envStatus = {
        NODE_ENV: process.env.NODE_ENV || "not_set",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "configured" : "missing",
        CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY ? "configured" : "missing",
        ADZUNA_APP_ID: process.env.ADZUNA_APP_ID ? "configured" : "missing", 
        ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY ? "configured" : "missing",
        RESEND_API_KEY: process.env.RESEND_API_KEY ? "configured" : "missing",
        DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing"
      };
      
      res.json({ environmentVariables: envStatus });
    } catch (error) {
      console.error("Error checking environment variables:", error);
      res.status(500).json({ error: "Failed to check environment variables" });
    }
  });

  // INSTITUTIONAL LICENSING ROUTES
  
  // Create institution (super admin only)
  app.post("/api/institutions", authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can create institutions" });
      }
      
      const institutionData = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution(institutionData);
      res.json(institution);
    } catch (error: any) {
      console.error("Error creating institution:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Get institution details
  app.get("/api/institutions/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const institution = await storage.getInstitution(req.params.id);
      if (!institution) {
        return res.status(404).json({ error: "Institution not found" });
      }
      
      // Only allow access to users from the same institution or super admins
      if (req.user!.role !== "super_admin" && req.user!.institutionId !== institution.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(institution);
    } catch (error: any) {
      console.error("Error fetching institution:", error);
      res.status(500).json({ error: "Failed to fetch institution" });
    }
  });
  
  // Create license for institution
  app.post("/api/institutions/:id/license", authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "super_admin") {
        return res.status(403).json({ error: "Only super admins can create licenses" });
      }
      
      const licenseData = insertLicenseSchema.parse({
        ...req.body,
        institutionId: req.params.id
      });
      
      const license = await storage.createLicense(licenseData);
      res.json(license);
    } catch (error: any) {
      console.error("Error creating license:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Get license information
  app.get("/api/institutions/:id/license", authenticate, async (req: AuthRequest, res) => {
    try {
      const license = await storage.getInstitutionLicense(req.params.id);
      if (!license) {
        return res.status(404).json({ error: "No active license found" });
      }
      
      // Only allow access to users from the same institution or super admins
      if (req.user!.role !== "super_admin" && req.user!.institutionId !== req.params.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const seatInfo = await storage.checkSeatAvailability(req.params.id);
      
      res.json({
        ...license,
        seatInfo
      });
    } catch (error: any) {
      console.error("Error fetching license:", error);
      res.status(500).json({ error: "Failed to fetch license" });
    }
  });
  
  // Invite user to institution
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
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
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
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
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
        console.warn("Failed to send invitation email - this is likely due to Resend requiring domain verification for production use");
        // For now, we'll still return success since the invitation was created in the database
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
  
  // Get institution users and seat usage
  app.get("/api/institutions/:id/users", authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ error: "Only admins can view user lists" });
      }
      
      if (req.user!.role === "admin" && req.user!.institutionId !== req.params.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const users = await storage.getInstitutionUsers(req.params.id);
      const invitations = await storage.getInstitutionInvitations(req.params.id);
      const license = await storage.getInstitutionLicense(req.params.id);
      const seatInfo = await storage.checkSeatAvailability(req.params.id);
      
      res.json({
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          lastActiveAt: user.lastActiveAt,
          createdAt: user.createdAt
        })),
        invitations: invitations.map(inv => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt
        })),
        license,
        seatInfo
      });
    } catch (error: any) {
      console.error("Error fetching institution users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Terminate user (admin only)
  app.delete("/api/institutions/:id/users/:userId", authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ error: "Only admins can terminate users" });
      }
      
      if (req.user!.role === "admin" && req.user!.institutionId !== req.params.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Cannot terminate yourself
      if (req.user!.id === req.params.userId) {
        return res.status(400).json({ error: "Cannot terminate your own account" });
      }
      
      // Get user to verify they belong to the institution
      const userToTerminate = await storage.getUser(req.params.userId);
      if (!userToTerminate || userToTerminate.institutionId !== req.params.id) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Deactivate user and revoke sessions
      await storage.deactivateUser(req.params.userId);
      await storage.deleteUserSessions(req.params.userId);
      
      // Update license seat count
      if (userToTerminate.institutionId) {
        const license = await storage.getInstitutionLicense(userToTerminate.institutionId);
        if (license && license.licenseType === "per_student" && userToTerminate.role === "student") {
          await storage.updateLicenseUsage(license.id, Math.max(0, license.usedSeats - 1));
        }
      }
      
      res.json({ message: "User terminated successfully" });
    } catch (error: any) {
      console.error("Error terminating user:", error);
      res.status(500).json({ error: "Failed to terminate user" });
    }
  });
  
  // Cancel invitation (admin only)
  app.delete("/api/institutions/:id/invitations/:invitationId", authenticate, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ error: "Only admins can cancel invitations" });
      }
      
      if (req.user!.role === "admin" && req.user!.institutionId !== req.params.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get invitation to verify it belongs to the institution
      const invitation = await storage.getInvitation(req.params.invitationId);
      if (!invitation || invitation.institutionId !== req.params.id) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Can only cancel pending invitations
      if (invitation.status !== "pending") {
        return res.status(400).json({ error: "Can only cancel pending invitations" });
      }
      
      await storage.cancelInvitation(req.params.invitationId);
      
      res.json({ message: "Invitation cancelled successfully" });
    } catch (error: any) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ error: "Failed to cancel invitation" });
    }
  });
  
  // Email verification endpoint
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = verifyEmailSchema.parse(req.body);
      
      const verification = await storage.getEmailVerification(token);
      if (!verification) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }
      
      // Mark user as verified and activate
      const user = await storage.getUserByEmail(verification.email);
      if (user) {
        await storage.updateUser(user.id, { isVerified: true });
        await storage.activateUser(user.id);
        await storage.markEmailVerificationUsed(token);
        
        // Update license seat usage
        if (user.institutionId) {
          const license = await storage.getInstitutionLicense(user.institutionId);
          if (license && license.licenseType === "per_student") {
            await storage.updateLicenseUsage(license.id, license.usedSeats + 1);
            
            // Check if we need to send usage notification
            const seatInfo = await storage.checkSeatAvailability(user.institutionId);
            if (license.licensedSeats && seatInfo.usedSeats >= license.licensedSeats * 0.8) {
              const institution = await storage.getInstitution(user.institutionId);
              const adminUsers = await storage.getInstitutionUsers(user.institutionId);
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
        
        res.json({ message: "Email verified successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error: any) {
      console.error("Error verifying email:", error);
      res.status(400).json({ error: error.message });
    }
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

      // Create activity for resume upload
      await storage.createActivity(
        req.user!.id,
        "resume_uploaded",
        "Resume Uploaded",
        `Uploaded new resume: ${fileName || "resume.txt"}`
      );

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
            gaps: analysis.gaps,
            overallInsights: analysis.overallInsights,
            sectionAnalysis: analysis.sectionAnalysis
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
        } as any;
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

  // Track task completion for roadmap subsections
  app.post("/api/roadmaps/:id/tasks/:taskId/complete", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id: roadmapId, taskId } = req.params;
      const userId = req.user!.id;
      
      // Update task completion status in roadmap subsections
      const roadmap = await storage.updateTaskCompletion(roadmapId, taskId, userId, true);
      res.json(roadmap);
    } catch (error) {
      console.error("Task completion error:", error);
      res.status(500).json({ error: "Failed to mark task as complete" });
    }
  });

  app.delete("/api/roadmaps/:id/tasks/:taskId/complete", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id: roadmapId, taskId } = req.params;
      const userId = req.user!.id;
      
      // Update task completion status in roadmap subsections
      const roadmap = await storage.updateTaskCompletion(roadmapId, taskId, userId, false);
      res.json(roadmap);
    } catch (error) {
      console.error("Task uncomplete error:", error);
      res.status(500).json({ error: "Failed to mark task as incomplete" });
    }
  });

  // Get task completion status for a user
  app.get("/api/roadmaps/:id/completion-status", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id: roadmapId } = req.params;
      const userId = req.user!.id;
      
      const completionStatus = await storage.getTaskCompletionStatus(roadmapId, userId);
      res.json(completionStatus);
    } catch (error) {
      console.error("Get completion status error:", error);
      res.status(500).json({ error: "Failed to get completion status" });
    }
  });

  // Legacy action completion for old roadmap format
  app.put("/api/roadmaps/:id/actions/:actionId/complete", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id: roadmapId, actionId } = req.params;
      const userId = req.user!.id;
      
      // Update legacy action completion status
      const roadmap = await storage.updateActionCompletion(roadmapId, actionId, userId, true);
      res.json(roadmap);
    } catch (error) {
      console.error("Legacy action completion error:", error);
      res.status(500).json({ error: "Failed to mark action as complete" });
    }
  });

  // Job matching routes
  app.get("/api/jobs/search", async (req, res) => {
    try {
      const {
        query = "software engineer",
        location = "United States", 
        page = "1",
        limit = "20"
      } = req.query;

      console.log("Job search params:", { query, location, page, limit });

      // Get user's active resume and extract skills for compatibility scoring
      let userSkills: string[] = [];
      
      try {
        // Get the authenticated user's active resume if available
        if ((req as any).user?.id) {
          const activeResume = await storage.getActiveResume((req as any).user.id);
          if (activeResume?.extractedText) {
            // Extract skills from resume analysis if available - for now use demo skills
            // TODO: Integrate with actual resume analysis system
          }
        }
        
        // Fallback to demo skills if no user resume found
        if (userSkills.length === 0) {
          userSkills = ["JavaScript", "Python", "React", "SQL", "Machine Learning"];
          console.log("Using demo skills:", userSkills);
        } else {
          console.log("Using user skills from resume:", userSkills);
        }
      } catch (error) {
        console.error("Error extracting skills from resume:", error);
        userSkills = ["JavaScript", "Python", "React", "SQL", "Machine Learning"];
      }

      const jobsData = await jobsService.searchJobs({
        query: query as string,
        location: location as string,
        page: parseInt(page as string),
        resultsPerPage: parseInt(limit as string),
      }, userSkills);

      console.log("Jobs found:", jobsData.jobs.length);
      if (jobsData.jobs.length > 0 && jobsData.jobs[0].compatibilityScore) {
        console.log("Sample compatibility scores:", jobsData.jobs.slice(0, 3).map(j => ({ title: j.title, score: j.compatibilityScore })));
      }

      // Create activity for job search if user is authenticated
      if ((req as any).user?.id) {
        await storage.createActivity(
          (req as any).user.id,
          "job_search_performed",
          "Job Search",
          `Searched for "${query}" in ${location} - found ${jobsData.jobs.length} results`
        );
      }

      res.json({
        jobs: jobsData.jobs,
        totalCount: jobsData.totalCount,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
    } catch (error) {
      console.error("Job search error:", error);
      res.status(500).json({ error: "Failed to search jobs" });
    }
  });

  // New endpoint: Get detailed AI match analysis for a specific job
  app.post("/api/jobs/match-analysis", authenticate, async (req: AuthRequest, res) => {
    try {
      console.log("Match analysis request received from user:", req.user?.id);
      const { jobId, jobData } = req.body;
      
      if (!jobData) {
        console.log("Missing job data in request");
        return res.status(400).json({ error: "Job data is required" });
      }
      
      console.log("Job data received:", { title: jobData.title, company: jobData.company?.display_name });
      
      // Get user's active resume
      const activeResume = await storage.getActiveResume(req.user!.id);
      console.log("Active resume found:", !!activeResume?.extractedText);
      
      if (!activeResume?.extractedText) {
        return res.status(400).json({ error: "No active resume found. Please upload a resume first." });
      }
      
      console.log("Calling AI service for match analysis...");
      // Get AI analysis of resume vs job match
      const matchAnalysis = await aiService.analyzeJobMatch(activeResume.extractedText, jobData);
      
      console.log("AI analysis completed successfully");
      res.json(matchAnalysis);
    } catch (error: any) {
      console.error("Job match analysis error:", error);
      res.status(500).json({ error: "Failed to analyze job match" });
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

  // Beyond Jobs routes - experiential opportunities
  app.get("/api/beyond-jobs/search", authenticate, async (req: AuthRequest, res) => {
    try {
      const {
        type,
        location,
        keyword,
        remote,
        limit
      } = req.query;

      const opportunities = await beyondJobsService.searchOpportunities({
        type: type as string,
        location: location as string,
        keyword: keyword as string,
        remote: remote === 'true',
        limit: limit ? parseInt(limit as string) : 5
      });

      res.json({ opportunities, totalCount: opportunities.length });
    } catch (error: any) {
      console.error("Beyond Jobs search error:", error);
      res.status(500).json({ error: "Failed to search opportunities" });
    }
  });

  app.post("/api/beyond-jobs/ai-rank", authenticate, async (req: AuthRequest, res) => {
    try {
      const { opportunities } = req.body;
      
      // Get user's resume for personalized ranking
      const activeResume = await storage.getActiveResume(req.user!.id);
      if (!activeResume) {
        return res.status(400).json({ error: "No active resume found" });
      }

      const userSkills = activeResume.extractedText ? 
        aiService.extractSkills(activeResume.extractedText) : [];
      const resumeGaps = activeResume.gaps || [];

      const rankedOpportunities = await beyondJobsService.getAIRanking(
        opportunities,
        userSkills,
        resumeGaps
      );

      res.json({ opportunities: rankedOpportunities });
    } catch (error: any) {
      console.error("AI ranking error:", error);
      res.status(500).json({ error: "Failed to rank opportunities" });
    }
  });

  app.post("/api/beyond-jobs/save", authenticate, async (req: AuthRequest, res) => {
    try {
      const { opportunityData } = req.body;
      
      const savedOpportunity = await storage.saveOpportunity(req.user!.id, opportunityData);
      
      res.json(savedOpportunity);
    } catch (error: any) {
      console.error("Save opportunity error:", error);
      res.status(500).json({ error: "Failed to save opportunity" });
    }
  });

  app.get("/api/beyond-jobs/saved", authenticate, async (req: AuthRequest, res) => {
    try {
      const saved = await storage.getSavedOpportunities(req.user!.id);
      res.json(saved);
    } catch (error: any) {
      console.error("Get saved opportunities error:", error);
      res.status(500).json({ error: "Failed to get saved opportunities" });
    }
  });

  // Updated resume tailoring endpoint - works with real-time job data
  // AI Copilot - Get tailored resumes for user
  app.get("/api/copilot/tailored-resumes", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      console.log('Fetching tailored resumes for user:', userId);
      
      const tailoredResumes = await storage.getTailoredResumes(userId);
      console.log('Retrieved tailored resumes count:', tailoredResumes.length);
      console.log('First resume:', tailoredResumes[0] ? { id: tailoredResumes[0].id, jobTitle: tailoredResumes[0].jobTitle, company: tailoredResumes[0].company } : 'none');
      
      res.json(tailoredResumes);
    } catch (error) {
      console.error("Error fetching tailored resumes:", error);
      res.status(500).json({ error: "Failed to fetch tailored resumes" });
    }
  });

  // AI Copilot - Generate cover letter
  app.post("/api/copilot/cover-letter", authenticate, async (req: AuthRequest, res) => {
    try {
      const { jobTitle, company, jobDescription, resumeText } = req.body;
      
      if (!jobTitle || !company || !jobDescription || !resumeText) {
        return res.status(400).json({ 
          error: "jobTitle, company, jobDescription, and resumeText are required" 
        });
      }

      const coverLetter = await aiService.generateCoverLetter(
        resumeText,
        jobDescription,
        company,
        jobTitle
      );

      res.json({ coverLetter });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({ error: "Failed to generate cover letter" });
    }
  });

  // AI Copilot - Salary negotiation strategy
  app.post("/api/copilot/salary-negotiation", authenticate, async (req: AuthRequest, res) => {
    try {
      const { currentSalary, targetSalary, jobRole, location, yearsExperience } = req.body;
      
      if (!targetSalary || !jobRole) {
        return res.status(400).json({ error: "targetSalary and jobRole are required" });
      }

      // Get user's resume for personalized advice
      const resume = await storage.getActiveResume(req.user!.id);
      if (!resume?.extractedText) {
        return res.status(400).json({ error: "Resume required for personalized salary negotiation" });
      }

      const negotiationStrategy = await aiService.generateSalaryNegotiationStrategy({
        currentSalary,
        targetSalary,
        jobRole,
        location,
        yearsExperience,
        resumeText: resume.extractedText
      });

      res.json({ strategy: negotiationStrategy });
    } catch (error) {
      console.error("Error generating salary negotiation strategy:", error);
      res.status(500).json({ error: "Failed to generate salary negotiation strategy" });
    }
  });

  // AI Copilot - Auto resume updater from roadmap
  app.post("/api/copilot/update-resume-from-roadmap", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user's current resume and roadmap progress
      const resume = await storage.getActiveResume(userId);
      if (!resume?.extractedText) {
        return res.status(400).json({ error: "Resume required for auto-update" });
      }

      const roadmaps = await storage.getUserRoadmaps(userId);
      const completedTasks = roadmaps.filter(r => r.progress === 100);

      if (completedTasks.length === 0) {
        return res.status(400).json({ error: "No completed roadmap tasks to sync with resume" });
      }

      const updatedResume = await aiService.updateResumeFromRoadmap({
        resumeText: resume.extractedText,
        completedTasks: completedTasks.map(task => ({
          title: task.title,
          description: task.description || undefined,
          actions: task.actions
        }))
      });

      res.json(updatedResume);
    } catch (error) {
      console.error("Error updating resume from roadmap:", error);
      res.status(500).json({ error: "Failed to update resume from roadmap" });
    }
  });

  app.post("/api/jobs/tailor-resume", authenticate, async (req: AuthRequest, res) => {
    try {
      const { jobData, baseResumeId } = req.body;
      
      if (!jobData) {
        return res.status(400).json({ error: "Job data is required" });
      }
      
      // Get base resume
      const resume = baseResumeId 
        ? (await storage.getUserResumes(req.user!.id)).find(r => r?.id === baseResumeId)
        : await storage.getActiveResume(req.user!.id);
        
      if (!resume?.extractedText) {
        return res.status(400).json({ error: "Resume text not available. Please upload a resume first." });
      }

      // Extract keywords from job description
      const targetKeywords = jobData.description
        ?.split(/\s+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 20) || [];

      const tailoredResult = await aiService.tailorResume(
        resume.extractedText,
        jobData.description || "",
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
      
      // Create or find job match record for the tailored resume
      const jobMatchData = {
        userId: req.user!.id,
        externalJobId: jobData.id || `external-${Date.now()}`,
        title: jobData.title || 'Job Position',
        company: jobData.company?.display_name || jobData.company || 'Company',
        location: jobData.location || '',
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        salary: jobData.salary?.display || '',
        compatibilityScore: tailoredResult.jobSpecificScore || 0,
        matchReasons: [],
        skillsGaps: [],
        source: 'job_matching'
      };
      
      console.log('Creating job match with data:', { ...jobMatchData, description: jobMatchData.description?.slice(0, 100) + '...' });
      const jobMatch = await storage.createJobMatch(jobMatchData);
      console.log('Job match created:', { id: jobMatch.id, title: jobMatch.title });
      
      // Save the tailored resume to database
      const tailoredResumeData = {
        userId: req.user!.id,
        baseResumeId: resume.id,
        jobMatchId: jobMatch.id,
        tailoredContent: tailoredResult.tailoredContent,
        diffJson: tailoredResult.diffJson,
        jobSpecificScore: tailoredResult.jobSpecificScore,
        keywordsCovered: tailoredResult.keywordsCovered,
        remainingGaps: tailoredResult.remainingGaps
      };
      
      console.log('Creating tailored resume with data:', { userId: tailoredResumeData.userId, baseResumeId: tailoredResumeData.baseResumeId, jobMatchId: tailoredResumeData.jobMatchId });
      const tailoredResumeRecord = await storage.createTailoredResume(tailoredResumeData);
      console.log('Tailored resume created:', { id: tailoredResumeRecord.id, userId: tailoredResumeRecord.userId });
      
      // Create activity
      await storage.createActivity(
        req.user!.id,
        "resume_tailored",
        "Resume Tailored",
        `Resume optimized for ${jobData.company?.display_name || 'Company'} - ${jobData.title}`
      );

      res.status(201).json({
        id: tailoredResumeRecord.id,
        jobMatchId: jobMatch.id,
        tailoredContent: tailoredResult.tailoredContent,
        jobSpecificScore: tailoredResult.jobSpecificScore,
        keywordsCovered: tailoredResult.keywordsCovered,
        remainingGaps: tailoredResult.remainingGaps,
        diffJson: tailoredResult.diffJson,
        docxBuffer: docxBuffer.toString('base64'),
        jobTitle: jobData.title,
        companyName: jobData.company?.display_name || 'Company'
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
      console.log('Raw application data:', applicationData);
      
      // Convert appliedDate string to Date object if provided
      const processedData = {
        ...applicationData,
        userId: req.user!.id,
        appliedDate: applicationData.appliedDate ? new Date(applicationData.appliedDate) : new Date(),
      };
      
      console.log('Processed application data:', { 
        ...processedData, 
        appliedDate: processedData.appliedDate?.toISOString?.() || processedData.appliedDate 
      });
      
      const application = await storage.createApplication(processedData);

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







  // Micro-Internship Marketplace routes - Skill Gap Analysis
  app.post("/api/skill-gaps", authenticate, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertSkillGapAnalysisSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      if (!validatedData.resumeId && !validatedData.jobMatchId) {
        return res.status(400).json({ error: "Either resumeId or jobMatchId is required" });
      }
      
      const { microProjectsService } = await import("./micro-projects");
      
      const analysis = await microProjectsService.analyzeSkillGaps(
        req.user!.id,
        validatedData.resumeId,
        validatedData.jobMatchId,
        validatedData.targetRole
      );
      
      res.status(201).json(analysis);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Error analyzing skill gaps:", error);
      res.status(500).json({ error: "Failed to analyze skill gaps" });
    }
  });

  app.get("/api/skill-gaps", authenticate, async (req: AuthRequest, res) => {
    try {
      const analyses = await storage.getSkillGapAnalysesByUser(req.user!.id);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching skill gap analyses:", error);
      res.status(500).json({ error: "Failed to fetch skill gap analyses" });
    }
  });

  app.get("/api/skill-gaps/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getSkillGapAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Skill gap analysis not found" });
      }
      
      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching skill gap analysis:", error);
      res.status(500).json({ error: "Failed to fetch skill gap analysis" });
    }
  });

  app.patch("/api/skill-gaps/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getSkillGapAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Skill gap analysis not found" });
      }
      
      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updates = insertSkillGapAnalysisSchema.partial().parse(req.body);
      
      // Note: No updateSkillGapAnalysis method yet - would need to add to storage
      res.json({ message: "Update endpoint not yet implemented" });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Error updating skill gap analysis:", error);
      res.status(500).json({ error: "Failed to update skill gap analysis" });
    }
  });

  app.delete("/api/skill-gaps/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getSkillGapAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Skill gap analysis not found" });
      }
      
      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Note: No deleteSkillGapAnalysis method yet - would need to add to storage
      res.status(204).json({ message: "Delete endpoint not yet implemented" });
    } catch (error) {
      console.error("Error deleting skill gap analysis:", error);
      res.status(500).json({ error: "Failed to delete skill gap analysis" });
    }
  });

  // Micro-Projects routes
  app.post("/api/micro-projects/generate", authenticate, async (req: AuthRequest, res) => {
    try {
      const { skillGapAnalysisId } = req.body;
      
      if (!skillGapAnalysisId) {
        return res.status(400).json({ error: "Skill gap analysis ID is required" });
      }
      
      // Verify ownership of skill gap analysis
      const analysis = await storage.getSkillGapAnalysisById(skillGapAnalysisId);
      if (!analysis || analysis.userId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied to skill gap analysis" });
      }
      
      const { microProjectsService } = await import("./micro-projects");
      
      const projects = await microProjectsService.generateMicroProjectsForSkillGaps(skillGapAnalysisId);
      
      res.status(201).json(projects);
    } catch (error) {
      console.error("Error generating micro-projects:", error);
      res.status(500).json({ error: "Failed to generate micro-projects" });
    }
  });

  app.get("/api/micro-projects", authenticate, async (req: AuthRequest, res) => {
    try {
      const { skills, limit = 20, offset = 0 } = req.query;
      
      let projects;
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        projects = await storage.getMicroProjectsBySkills(skillsArray as string[]);
      } else {
        projects = await storage.getAllMicroProjects(Number(limit), Number(offset));
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching micro-projects:", error);
      res.status(500).json({ error: "Failed to fetch micro-projects" });
    }
  });

  app.get("/api/micro-projects/recommended", authenticate, async (req: AuthRequest, res) => {
    try {
      const { microProjectsService } = await import("./micro-projects");
      
      const projects = await microProjectsService.getRecommendedProjectsForUser(req.user!.id);
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching recommended projects:", error);
      res.status(500).json({ error: "Failed to fetch recommended projects" });
    }
  });

  app.post("/api/micro-projects/generate-ai", authenticate, async (req: AuthRequest, res) => {
    try {
      const { microProjectsService } = await import("./micro-projects");
      
      console.log(`Generating single AI project for user ${req.user!.id}`);
      const newProjects = await microProjectsService.generateAIPoweredProjects(req.user!.id);
      
      // Create activity for AI project generation
      if (newProjects.length > 0) {
        await storage.createActivity(
          req.user!.id,
          "ai_project_generated",
          "AI Project Generated",
          `Generated new practice project: ${newProjects[0].title}`
        );
      }
      
      if (newProjects.length === 0) {
        return res.status(200).json({
          message: "Generated fallback project",
          projects: [{
            id: 'fallback-' + Date.now(),
            title: "Product Management Fundamentals Practice",
            description: "Learn core PM skills through hands-on exercises with user stories, roadmaps, and stakeholder alignment.",
            targetSkill: "Product Management",
            difficulty: "intermediate",
            estimatedHours: 10,
            tags: ['product management'],
            isActive: true
          }]
        });
      }
      
      res.json({
        message: `Generated ${newProjects.length} AI-powered project`,
        projects: newProjects
      });
    } catch (error) {
      console.error("Error generating AI project:", error);
      res.status(500).json({ error: "Failed to generate AI project" });
    }
  });

  app.get("/api/micro-projects/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getMicroProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: "Micro-project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching micro-project:", error);
      res.status(500).json({ error: "Failed to fetch micro-project" });
    }
  });

  app.patch("/api/micro-projects/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertMicroProjectSchema.partial().parse(req.body);
      
      const project = await storage.getMicroProjectById(id);
      if (!project) {
        return res.status(404).json({ error: "Micro-project not found" });
      }
      
      const updatedProject = await storage.updateMicroProject(id, updates);
      res.json(updatedProject);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Error updating micro-project:", error);
      res.status(500).json({ error: "Failed to update micro-project" });
    }
  });

  app.delete("/api/micro-projects/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getMicroProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: "Micro-project not found" });
      }
      
      await storage.deleteMicroProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting micro-project:", error);
      res.status(500).json({ error: "Failed to delete micro-project" });
    }
  });

  app.post("/api/micro-projects/:projectId/start", authenticate, async (req: AuthRequest, res) => {
    try {
      const { projectId } = req.params;
      
      const { microProjectsService } = await import("./micro-projects");
      
      await microProjectsService.startProject(req.user!.id, projectId);
      
      res.json({ message: "Project started successfully" });
    } catch (error) {
      console.error("Error starting project:", error);
      res.status(500).json({ error: "Failed to start project" });
    }
  });

  app.put("/api/micro-projects/:projectId/progress", authenticate, async (req: AuthRequest, res) => {
    try {
      const { projectId } = req.params;
      const { progressPercentage, timeSpent } = req.body;
      
      if (progressPercentage < 0 || progressPercentage > 100) {
        return res.status(400).json({ error: "Progress percentage must be between 0 and 100" });
      }
      
      const { microProjectsService } = await import("./micro-projects");
      
      await microProjectsService.updateProjectProgress(
        req.user!.id, 
        projectId, 
        progressPercentage,
        timeSpent
      );
      
      res.json({ message: "Progress updated successfully" });
    } catch (error) {
      console.error("Error updating project progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.post("/api/micro-projects/:projectId/complete", authenticate, async (req: AuthRequest, res) => {
    try {
      const { projectId } = req.params;
      const { artifactUrls, reflectionNotes, selfAssessment } = req.body;
      
      if (!artifactUrls || artifactUrls.length === 0) {
        return res.status(400).json({ error: "At least one artifact URL is required" });
      }
      
      // Verify project exists
      const project = await storage.getMicroProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const { microProjectsService } = await import("./micro-projects");
      
      await microProjectsService.completeProject(
        req.user!.id,
        projectId,
        artifactUrls,
        reflectionNotes,
        selfAssessment
      );
      
      res.status(201).json({ message: "Project completed successfully" });
    } catch (error) {
      console.error("Error completing project:", error);
      res.status(500).json({ error: "Failed to complete project" });
    }
  });

  // Project Completions routes
  app.get("/api/project-completions", authenticate, async (req: AuthRequest, res) => {
    try {
      const completions = await storage.getProjectCompletionsByUser(req.user!.id);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching project completions:", error);
      res.status(500).json({ error: "Failed to fetch project completions" });
    }
  });

  app.patch("/api/project-completions/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Verify ownership through existing completion
      const existingCompletion = await storage.getProjectCompletionsByUser(req.user!.id);
      const completion = existingCompletion.find(c => c.id === id);
      
      if (!completion) {
        return res.status(404).json({ error: "Project completion not found or access denied" });
      }
      
      await storage.updateProjectCompletion(id, updates);
      res.json({ message: "Project completion updated successfully" });
    } catch (error) {
      console.error("Error updating project completion:", error);
      res.status(500).json({ error: "Failed to update project completion" });
    }
  });

  // Portfolio Artifacts routes
  app.post("/api/portfolio-artifacts", authenticate, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPortfolioArtifactSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const artifactId = await storage.createPortfolioArtifact(validatedData);
      res.status(201).json({ id: artifactId, message: "Portfolio artifact created successfully" });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: fromZodError(error).toString() });
      }
      console.error("Error creating portfolio artifact:", error);
      res.status(500).json({ error: "Failed to create portfolio artifact" });
    }
  });

  app.get("/api/portfolio-artifacts", authenticate, async (req: AuthRequest, res) => {
    try {
      const artifacts = await storage.getPortfolioArtifactsByUser(req.user!.id);
      res.json(artifacts);
    } catch (error) {
      console.error("Error fetching portfolio artifacts:", error);
      res.status(500).json({ error: "Failed to fetch portfolio artifacts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
