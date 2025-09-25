import { 
  users, sessions, resumes, roadmaps, jobMatches, tailoredResumes, 
  applications, achievements, activities, resources, institutions,
  licenses, invitations, emailVerifications,
  skillGapAnalyses, microProjects, projectCompletions, portfolioArtifacts,
  type User, type InsertUser, type Resume, type InsertResume,
  type Roadmap, type InsertRoadmap, type JobMatch, type InsertJobMatch,
  type TailoredResume, type Application, type InsertApplication,
  type Achievement, type Activity, type Resource, type Institution,
  type InsertInstitution, type License, type InsertLicense,
  type Invitation, type InsertInvitation, type EmailVerification,
  type InsertEmailVerification,
  type SkillGapAnalysis, type InsertSkillGapAnalysis, type MicroProject,
  type InsertMicroProject, type ProjectCompletion, type InsertProjectCompletion,
  type PortfolioArtifact, type InsertPortfolioArtifact
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Sessions
  createSession(userId: string, token: string, expiresAt: Date): Promise<void>;
  getSession(token: string): Promise<{ user: User } | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  
  // Resumes
  createResume(resume: InsertResume): Promise<Resume>;
  getUserResumes(userId: string): Promise<Resume[]>;
  getActiveResume(userId: string): Promise<Resume | undefined>;
  updateResumeAnalysis(id: string, analysis: any): Promise<Resume>;
  getResumeById(id: string): Promise<Resume | undefined>;
  
  // Roadmaps
  createRoadmap(roadmap: InsertRoadmap): Promise<Roadmap>;
  getUserRoadmaps(userId: string): Promise<Roadmap[]>;
  updateRoadmapProgress(id: string, progress: number): Promise<Roadmap>;
  updateActionCompletion(roadmapId: string, actionId: string, userId: string, completed: boolean): Promise<Roadmap>;
  updateTaskCompletion(roadmapId: string, taskId: string, userId: string, completed: boolean): Promise<Roadmap>;
  getTaskCompletionStatus(roadmapId: string, userId: string): Promise<{ [taskId: string]: boolean }>;
  
  // Job Matches
  createJobMatch(jobMatch: InsertJobMatch): Promise<JobMatch>;
  getUserJobMatches(userId: string, limit?: number): Promise<JobMatch[]>;
  updateJobMatchBookmark(id: string, isBookmarked: boolean): Promise<JobMatch>;
  getJobMatchById(id: string): Promise<JobMatch | undefined>;
  
  // Tailored Resumes
  createTailoredResume(tailoredResume: any): Promise<TailoredResume>;
  getTailoredResumes(userId: string): Promise<any[]>;
  
  // Applications
  createApplication(application: InsertApplication): Promise<Application>;
  getUserApplications(userId: string): Promise<Application[]>;
  updateApplicationStatus(id: string, status: string, responseDate?: Date): Promise<Application>;
  
  // Activities
  createActivity(userId: string, type: string, title: string, description: string, metadata?: any): Promise<Activity>;
  getUserActivities(userId: string, limit?: number): Promise<Activity[]>;
  
  // Achievements
  createAchievement(userId: string, title: string, description: string, icon: string): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  
  // Resources
  getResources(skillCategories?: string[]): Promise<Resource[]>;
  
  // Institutions & Licensing
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  getInstitution(id: string): Promise<Institution | undefined>;
  getInstitutionByDomain(domain: string): Promise<Institution | undefined>;
  updateInstitution(id: string, updates: Partial<InsertInstitution>): Promise<Institution>;
  
  // Licenses
  createLicense(license: InsertLicense): Promise<License>;
  getInstitutionLicense(institutionId: string): Promise<License | undefined>;
  updateLicenseUsage(licenseId: string, usedSeats: number): Promise<License>;
  checkSeatAvailability(institutionId: string): Promise<{ available: boolean; usedSeats: number; totalSeats: number | null }>;
  
  // Invitations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitation(id: string): Promise<Invitation | undefined>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  claimInvitation(token: string, userId: string): Promise<Invitation>;
  cancelInvitation(id: string): Promise<void>;
  getInstitutionInvitations(institutionId: string): Promise<Invitation[]>;
  
  // Email Verification
  createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification>;
  getEmailVerification(token: string): Promise<EmailVerification | undefined>;
  markEmailVerificationUsed(token: string): Promise<void>;
  
  // User management with licensing
  activateUser(userId: string): Promise<User>;
  deactivateUser(userId: string): Promise<User>;
  getInstitutionUsers(institutionId: string, activeOnly?: boolean): Promise<User[]>;
  checkDomainAllowlist(email: string, institutionId: string): Promise<boolean>;
  
  
  // Micro-Internship Marketplace
  createSkillGapAnalysis(analysis: InsertSkillGapAnalysis): Promise<string>;
  getSkillGapAnalysisById(id: string): Promise<SkillGapAnalysis | undefined>;
  getSkillGapAnalysesByUser(userId: string): Promise<SkillGapAnalysis[]>;
  
  createMicroProject(project: InsertMicroProject): Promise<string>;
  getMicroProjectById(id: string): Promise<MicroProject | undefined>;
  getMicroProjectsBySkills(skills: string[]): Promise<MicroProject[]>;
  
  createProjectCompletion(completion: InsertProjectCompletion): Promise<string>;
  getProjectCompletion(userId: string, projectId: string): Promise<ProjectCompletion | undefined>;
  getProjectCompletionsByUser(userId: string): Promise<ProjectCompletion[]>;
  updateProjectCompletion(id: string, updates: Partial<ProjectCompletion>): Promise<void>;
  
  createPortfolioArtifact(artifact: InsertPortfolioArtifact): Promise<string>;
  getPortfolioArtifactsByUser(userId: string): Promise<PortfolioArtifact[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createSession(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(sessions).values({ userId, token, expiresAt });
  }

  async getSession(token: string): Promise<{ user: User } | undefined> {
    const [session] = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), sql`${sessions.expiresAt} > now()`));
    
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }
  
  async createResume(resume: InsertResume): Promise<Resume> {
    // Deactivate other resumes
    await db
      .update(resumes)
      .set({ isActive: false })
      .where(eq(resumes.userId, resume.userId));
    
    const [newResume] = await db.insert(resumes).values(resume).returning();
    return newResume;
  }

  async getUserResumes(userId: string): Promise<Resume[]> {
    return await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt));
  }

  async getActiveResume(userId: string): Promise<Resume | undefined> {
    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isActive, true)));
    return resume || undefined;
  }

  async updateResumeAnalysis(id: string, analysis: any): Promise<Resume> {
    // Filter only valid database fields and remove undefined values
    const validFields = {
      ...(analysis.rmsScore !== undefined && { rmsScore: analysis.rmsScore }),
      ...(analysis.skillsScore !== undefined && { skillsScore: analysis.skillsScore }),
      ...(analysis.experienceScore !== undefined && { experienceScore: analysis.experienceScore }),
      ...(analysis.keywordsScore !== undefined && { keywordsScore: analysis.keywordsScore }),
      ...(analysis.educationScore !== undefined && { educationScore: analysis.educationScore }),
      ...(analysis.certificationsScore !== undefined && { certificationsScore: analysis.certificationsScore }),
      ...(analysis.gaps !== undefined && { gaps: analysis.gaps }),
      ...(analysis.overallInsights !== undefined && { overallInsights: analysis.overallInsights }),
      ...(analysis.sectionAnalysis !== undefined && { sectionAnalysis: analysis.sectionAnalysis })
    };

    // Only update if we have valid fields
    if (Object.keys(validFields).length === 0) {
      throw new Error("No valid analysis fields to update");
    }

    const [resume] = await db
      .update(resumes)
      .set(validFields)
      .where(eq(resumes.id, id))
      .returning();
    return resume;
  }

  async createRoadmap(roadmap: InsertRoadmap): Promise<Roadmap> {
    // Deactivate other roadmaps for the same phase
    await db
      .update(roadmaps)
      .set({ isActive: false })
      .where(and(eq(roadmaps.userId, roadmap.userId), eq(roadmaps.phase, roadmap.phase)));
    
    const [newRoadmap] = await db.insert(roadmaps).values(roadmap).returning();
    return newRoadmap;
  }

  async getUserRoadmaps(userId: string): Promise<Roadmap[]> {
    return await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.userId, userId), eq(roadmaps.isActive, true)))
      .orderBy(roadmaps.phase);
  }

  async updateRoadmapProgress(id: string, progress: number): Promise<Roadmap> {
    const [roadmap] = await db
      .update(roadmaps)
      .set({ progress, updatedAt: sql`now()` })
      .where(eq(roadmaps.id, id))
      .returning();
    return roadmap;
  }

  async updateActionCompletion(roadmapId: string, actionId: string, userId: string, completed: boolean): Promise<Roadmap> {
    // Get the current roadmap
    const [currentRoadmap] = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.id, roadmapId));
    
    if (!currentRoadmap || !currentRoadmap.actions) {
      throw new Error("Roadmap not found or has no actions");
    }

    // Update the action completion status
    const updatedActions = (currentRoadmap.actions as any[]).map(action => {
      if (action.id === actionId) {
        return { ...action, completed };
      }
      return action;
    });

    // Calculate overall progress
    const completedCount = updatedActions.filter(action => action.completed).length;
    const progress = Math.round((completedCount / updatedActions.length) * 100);

    // Update the roadmap
    const [updatedRoadmap] = await db
      .update(roadmaps)
      .set({ 
        actions: updatedActions,
        progress,
        updatedAt: sql`now()` 
      })
      .where(eq(roadmaps.id, roadmapId))
      .returning();

    return updatedRoadmap;
  }

  async updateTaskCompletion(roadmapId: string, taskId: string, userId: string, completed: boolean): Promise<Roadmap> {
    // Get the current roadmap
    const [currentRoadmap] = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.id, roadmapId));
    
    if (!currentRoadmap || !currentRoadmap.subsections) {
      throw new Error("Roadmap not found or has no subsections");
    }

    // Update the task completion status in subsections
    const updatedSubsections = (currentRoadmap.subsections as any[]).map(subsection => {
      if (subsection.tasks) {
        subsection.tasks = subsection.tasks.map((task: any) => {
          if (task.id === taskId) {
            return { ...task, completed };
          }
          return task;
        });
      }
      return subsection;
    });

    // Calculate overall progress
    let totalTasks = 0;
    let completedTasks = 0;
    
    updatedSubsections.forEach(subsection => {
      if (subsection.tasks) {
        totalTasks += subsection.tasks.length;
        completedTasks += subsection.tasks.filter((task: any) => task.completed).length;
      }
    });

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update the roadmap
    const [updatedRoadmap] = await db
      .update(roadmaps)
      .set({ 
        subsections: updatedSubsections,
        progress,
        updatedAt: sql`now()` 
      })
      .where(eq(roadmaps.id, roadmapId))
      .returning();

    return updatedRoadmap;
  }

  async getTaskCompletionStatus(roadmapId: string, userId: string): Promise<{ [taskId: string]: boolean }> {
    const [roadmap] = await db
      .select()
      .from(roadmaps)
      .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, userId)));
    
    if (!roadmap || !roadmap.subsections) {
      return {};
    }

    const completionStatus: { [taskId: string]: boolean } = {};
    
    (roadmap.subsections as any[]).forEach(subsection => {
      if (subsection.tasks) {
        subsection.tasks.forEach((task: any) => {
          completionStatus[task.id] = task.completed || false;
        });
      }
    });

    return completionStatus;
  }

  async createJobMatch(jobMatch: InsertJobMatch): Promise<JobMatch> {
    const [match] = await db.insert(jobMatches).values(jobMatch).returning();
    return match;
  }

  async getUserJobMatches(userId: string, limit = 20): Promise<JobMatch[]> {
    return await db
      .select()
      .from(jobMatches)
      .where(eq(jobMatches.userId, userId))
      .orderBy(desc(jobMatches.compatibilityScore))
      .limit(limit);
  }

  async updateJobMatchBookmark(id: string, isBookmarked: boolean): Promise<JobMatch> {
    const [jobMatch] = await db
      .update(jobMatches)
      .set({ isBookmarked })
      .where(eq(jobMatches.id, id))
      .returning();
    return jobMatch;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [app] = await db.insert(applications).values(application).returning();
    return app;
  }

  async getUserApplications(userId: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedDate));
  }

  async updateApplicationStatus(id: string, status: string, responseDate?: Date): Promise<Application> {
    const updates: any = { status, updatedAt: sql`now()` };
    if (responseDate) updates.responseDate = responseDate;
    
    const [application] = await db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async createActivity(userId: string, type: string, title: string, description: string, metadata?: any): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({ userId, type, title, description, metadata })
      .returning();
    return activity;
  }

  async getUserActivities(userId: string, limit = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createAchievement(userId: string, title: string, description: string, icon: string): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values({ userId, title, description, icon })
      .returning();
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));
  }

  async createTailoredResume(tailoredResume: any): Promise<TailoredResume> {
    const [newTailoredResume] = await db.insert(tailoredResumes).values(tailoredResume).returning();
    return newTailoredResume;
  }

  async getTailoredResumes(userId: string): Promise<any[]> {
    return await db
      .select({
        id: tailoredResumes.id,
        tailoredContent: tailoredResumes.tailoredContent,
        jobSpecificScore: tailoredResumes.jobSpecificScore,
        keywordsCovered: tailoredResumes.keywordsCovered,
        createdAt: tailoredResumes.createdAt,
        jobTitle: jobMatches.title,
        company: jobMatches.company,
        baseResumeFileName: resumes.fileName,
      })
      .from(tailoredResumes)
      .leftJoin(jobMatches, eq(tailoredResumes.jobMatchId, jobMatches.id))
      .leftJoin(resumes, eq(tailoredResumes.baseResumeId, resumes.id))
      .where(eq(tailoredResumes.userId, userId))
      .orderBy(desc(tailoredResumes.createdAt));
  }

  async getResources(skillCategories?: string[]): Promise<Resource[]> {
    if (!skillCategories?.length) {
      return await db.select().from(resources).orderBy(desc(resources.relevanceScore));
    }
    
    return await db
      .select()
      .from(resources)
      .where(sql`${resources.skillCategories} && ${skillCategories}`)
      .orderBy(desc(resources.relevanceScore));
  }
  
  // Institution & Licensing Methods
  
  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const [newInstitution] = await db.insert(institutions).values(institution).returning();
    return newInstitution;
  }
  
  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution || undefined;
  }
  
  async getInstitutionByDomain(domain: string): Promise<Institution | undefined> {
    const [institution] = await db
      .select()
      .from(institutions)
      .where(
        or(
          eq(institutions.domain, domain),
          sql`${domain} = ANY(${institutions.allowedDomains})`
        )
      );
    return institution || undefined;
  }
  
  async updateInstitution(id: string, updates: Partial<InsertInstitution>): Promise<Institution> {
    const [institution] = await db
      .update(institutions)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(institutions.id, id))
      .returning();
    return institution;
  }
  
  async createLicense(license: InsertLicense): Promise<License> {
    // Deactivate existing licenses for the institution
    await db
      .update(licenses)
      .set({ isActive: false, updatedAt: sql`now()` })
      .where(eq(licenses.institutionId, license.institutionId));
    
    const [newLicense] = await db.insert(licenses).values(license).returning();
    return newLicense;
  }
  
  async getInstitutionLicense(institutionId: string): Promise<License | undefined> {
    const [license] = await db
      .select()
      .from(licenses)
      .where(and(
        eq(licenses.institutionId, institutionId),
        eq(licenses.isActive, true),
        sql`${licenses.endDate} > now()`
      ))
      .orderBy(desc(licenses.createdAt));
    return license || undefined;
  }
  
  async updateLicenseUsage(licenseId: string, usedSeats: number): Promise<License> {
    const [license] = await db
      .update(licenses)
      .set({ usedSeats, updatedAt: sql`now()` })
      .where(eq(licenses.id, licenseId))
      .returning();
    return license;
  }
  
  async checkSeatAvailability(institutionId: string): Promise<{ available: boolean; usedSeats: number; totalSeats: number | null }> {
    const license = await this.getInstitutionLicense(institutionId);
    if (!license) {
      return { available: false, usedSeats: 0, totalSeats: null };
    }
    
    // Site licenses have unlimited seats
    if (license.licenseType === "site") {
      return { available: true, usedSeats: license.usedSeats, totalSeats: null };
    }
    
    // Per-student licenses have seat limits
    const available = license.usedSeats < (license.licensedSeats || 0);
    return {
      available,
      usedSeats: license.usedSeats,
      totalSeats: license.licensedSeats
    };
  }
  
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const [newInvitation] = await db.insert(invitations).values(invitation).returning();
    return newInvitation;
  }
  
  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(and(
        eq(invitations.token, token),
        eq(invitations.status, "pending"),
        sql`${invitations.expiresAt} > now()`
      ));
    return invitation || undefined;
  }
  
  async claimInvitation(token: string, userId: string): Promise<Invitation> {
    const [invitation] = await db
      .update(invitations)
      .set({ 
        status: "claimed", 
        claimedBy: userId, 
        claimedAt: sql`now()` 
      })
      .where(eq(invitations.token, token))
      .returning();
    return invitation;
  }
  
  async getInstitutionInvitations(institutionId: string): Promise<Invitation[]> {
    return await db
      .select()
      .from(invitations)
      .where(eq(invitations.institutionId, institutionId))
      .orderBy(desc(invitations.createdAt));
  }
  
  async getInvitation(id: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id));
    return invitation || undefined;
  }
  
  async cancelInvitation(id: string): Promise<void> {
    await db
      .update(invitations)
      .set({ status: "expired" })
      .where(eq(invitations.id, id));
  }
  
  async createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const [newVerification] = await db.insert(emailVerifications).values(verification).returning();
    return newVerification;
  }
  
  async getEmailVerification(token: string): Promise<EmailVerification | undefined> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(and(
        eq(emailVerifications.token, token),
        eq(emailVerifications.isUsed, false),
        sql`${emailVerifications.expiresAt} > now()`
      ));
    return verification || undefined;
  }
  
  async markEmailVerificationUsed(token: string): Promise<void> {
    await db
      .update(emailVerifications)
      .set({ isUsed: true })
      .where(eq(emailVerifications.token, token));
  }
  
  async activateUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: true, lastActiveAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async deactivateUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: sql`now()` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  async getInstitutionUsers(institutionId: string, activeOnly = true): Promise<User[]> {
    const whereConditions = [eq(users.institutionId, institutionId)];
    if (activeOnly) {
      whereConditions.push(eq(users.isActive, true));
    }
    
    return await db
      .select()
      .from(users)
      .where(and(...whereConditions))
      .orderBy(desc(users.createdAt));
  }
  
  async checkDomainAllowlist(email: string, institutionId: string): Promise<boolean> {
    const domain = email.split('@')[1];
    const institution = await this.getInstitution(institutionId);
    
    if (!institution) {
      return false;
    }
    
    // Check primary domain
    if (institution.domain === domain) {
      return true;
    }
    
    // Check allowed domains array
    if (institution.allowedDomains && institution.allowedDomains.includes(domain)) {
      return true;
    }
    
    return false;
  }


  // Additional required methods
  async getResumeById(id: string): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume || undefined;
  }

  async getJobMatchById(id: string): Promise<JobMatch | undefined> {
    const [jobMatch] = await db.select().from(jobMatches).where(eq(jobMatches.id, id));
    return jobMatch || undefined;
  }

  // Micro-Internship Marketplace implementations
  async createSkillGapAnalysis(analysis: InsertSkillGapAnalysis): Promise<string> {
    const [result] = await db.insert(skillGapAnalyses).values(analysis).returning({ id: skillGapAnalyses.id });
    return result.id;
  }

  async getSkillGapAnalysisById(id: string): Promise<SkillGapAnalysis | undefined> {
    const [analysis] = await db.select().from(skillGapAnalyses).where(eq(skillGapAnalyses.id, id));
    return analysis || undefined;
  }

  async getSkillGapAnalysesByUser(userId: string): Promise<SkillGapAnalysis[]> {
    return await db
      .select()
      .from(skillGapAnalyses)
      .where(eq(skillGapAnalyses.userId, userId))
      .orderBy(desc(skillGapAnalyses.createdAt));
  }

  async createMicroProject(project: InsertMicroProject): Promise<string> {
    const [result] = await db.insert(microProjects).values(project).returning({ id: microProjects.id });
    return result.id;
  }

  async getMicroProjectById(id: string): Promise<MicroProject | undefined> {
    const [project] = await db.select().from(microProjects).where(eq(microProjects.id, id));
    return project || undefined;
  }

  async getMicroProjectsBySkills(skills: string[]): Promise<MicroProject[]> {
    if (skills.length === 0) return [];
    
    const conditions = skills.map(skill => 
      or(
        eq(microProjects.targetSkill, skill),
        sql`${microProjects.tags} && ${[skill.toLowerCase()]}`
      )
    );

    return await db
      .select()
      .from(microProjects)
      .where(and(
        eq(microProjects.isActive, true),
        or(...conditions)
      ))
      .orderBy(desc(microProjects.createdAt))
      .limit(10);
  }

  async createProjectCompletion(completion: InsertProjectCompletion): Promise<string> {
    const [result] = await db.insert(projectCompletions).values(completion).returning({ id: projectCompletions.id });
    return result.id;
  }

  async getProjectCompletion(userId: string, projectId: string): Promise<ProjectCompletion | undefined> {
    const [completion] = await db
      .select()
      .from(projectCompletions)
      .where(and(
        eq(projectCompletions.userId, userId),
        eq(projectCompletions.projectId, projectId)
      ));
    return completion || undefined;
  }

  async getProjectCompletionsByUser(userId: string): Promise<ProjectCompletion[]> {
    return await db
      .select()
      .from(projectCompletions)
      .where(eq(projectCompletions.userId, userId))
      .orderBy(desc(projectCompletions.createdAt));
  }

  async updateProjectCompletion(id: string, updates: Partial<ProjectCompletion>): Promise<void> {
    await db
      .update(projectCompletions)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(projectCompletions.id, id));
  }

  async createPortfolioArtifact(artifact: InsertPortfolioArtifact): Promise<string> {
    const [result] = await db.insert(portfolioArtifacts).values(artifact).returning({ id: portfolioArtifacts.id });
    return result.id;
  }

  async getPortfolioArtifactsByUser(userId: string): Promise<PortfolioArtifact[]> {
    return await db
      .select()
      .from(portfolioArtifacts)
      .where(eq(portfolioArtifacts.userId, userId))
      .orderBy(desc(portfolioArtifacts.createdAt));
  }
}

export const storage = new DatabaseStorage();
