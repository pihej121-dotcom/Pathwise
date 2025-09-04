import { 
  users, sessions, resumes, roadmaps, jobMatches, tailoredResumes, 
  applications, achievements, activities, resources,
  type User, type InsertUser, type Resume, type InsertResume,
  type Roadmap, type InsertRoadmap, type JobMatch, type InsertJobMatch,
  type TailoredResume, type Application, type InsertApplication,
  type Achievement, type Activity, type Resource
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
  
  // Roadmaps
  createRoadmap(roadmap: InsertRoadmap): Promise<Roadmap>;
  getUserRoadmaps(userId: string): Promise<Roadmap[]>;
  updateRoadmapProgress(id: string, progress: number): Promise<Roadmap>;
  
  // Job Matches
  createJobMatch(jobMatch: InsertJobMatch): Promise<JobMatch>;
  getUserJobMatches(userId: string, limit?: number): Promise<JobMatch[]>;
  updateJobMatchBookmark(id: string, isBookmarked: boolean): Promise<JobMatch>;
  
  // Tailored Resumes
  createTailoredResume(tailoredResume: any): Promise<TailoredResume>;
  
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
    const [resume] = await db
      .update(resumes)
      .set(analysis)
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
}

export const storage = new DatabaseStorage();
