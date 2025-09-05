import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["student", "admin"]);
export const applicationStatusEnum = pgEnum("application_status", ["applied", "interviewed", "rejected", "offered"]);
export const roadmapPhaseEnum = pgEnum("roadmap_phase", ["30_days", "3_months", "6_months"]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  isVerified: boolean("is_verified").notNull().default(false),
  school: text("school"),
  major: text("major"),
  gradYear: integer("grad_year"),
  targetRole: text("target_role"),
  industries: text("industries").array(),
  targetCompanies: text("target_companies").array(),
  location: text("location"),
  remoteOk: boolean("remote_ok").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User sessions
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Resumes
export const resumes = pgTable("resumes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  extractedText: text("extracted_text"),
  rmsScore: integer("rms_score"),
  skillsScore: integer("skills_score"),
  experienceScore: integer("experience_score"),
  keywordsScore: integer("keywords_score"),
  educationScore: integer("education_score"),
  certificationsScore: integer("certifications_score"),
  gaps: jsonb("gaps"), // Array of gap objects with priority, impact, rationale, resources
  overallInsights: jsonb("overall_insights"), // Overall analysis insights
  sectionAnalysis: jsonb("section_analysis"), // Detailed section-by-section analysis
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Career roadmaps
export const roadmaps = pgTable("roadmaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phase: roadmapPhaseEnum("phase").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  actions: jsonb("actions"), // Array of action objects
  subsections: jsonb("subsections"), // Array of subsection objects with completion tracking
  progress: integer("progress").default(0), // 0-100
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Roadmap subsection completion tracking
export const roadmapSubsections = pgTable("roadmap_subsections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roadmapId: varchar("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subsectionIndex: integer("subsection_index").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  tasks: jsonb("tasks"), // Array of task objects
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Job matches
export const jobMatches = pgTable("job_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  externalJobId: text("external_job_id").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  description: text("description"),
  requirements: text("requirements"),
  salary: text("salary"),
  compatibilityScore: integer("compatibility_score"), // 0-100
  matchReasons: text("match_reasons").array(),
  skillsGaps: text("skills_gaps").array(),
  resourceLinks: jsonb("resource_links"), // Array of resource objects
  source: text("source").default("adzuna"), // adzuna, coresignal, usajobs
  isBookmarked: boolean("is_bookmarked").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Tailored resumes
export const tailoredResumes = pgTable("tailored_resumes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  baseResumeId: varchar("base_resume_id").notNull().references(() => resumes.id),
  jobMatchId: varchar("job_match_id").notNull().references(() => jobMatches.id),
  tailoredContent: text("tailored_content").notNull(),
  diffJson: jsonb("diff_json"), // Source map of all edits
  jobSpecificScore: integer("job_specific_score"), // 0-100
  keywordsCovered: text("keywords_covered").array(),
  remainingGaps: jsonb("remaining_gaps"),
  docxPath: text("docx_path"),
  pdfPath: text("pdf_path"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Applications
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobMatchId: varchar("job_match_id").references(() => jobMatches.id),
  tailoredResumeId: varchar("tailored_resume_id").references(() => tailoredResumes.id),
  company: text("company").notNull(),
  position: text("position").notNull(),
  status: applicationStatusEnum("status").notNull().default("applied"),
  appliedDate: timestamp("applied_date").notNull().default(sql`now()`),
  responseDate: timestamp("response_date"),
  notes: text("notes"),
  attachments: text("attachments").array(), // File paths
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  unlockedAt: timestamp("unlocked_at").notNull().default(sql`now()`),
});

// User activities
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // completed_task, earned_achievement, etc.
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Resources
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  provider: text("provider").notNull(),
  url: text("url").notNull(),
  cost: text("cost"),
  skillCategories: text("skill_categories").array(),
  relevanceScore: integer("relevance_score"), // 0-100
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  resumes: many(resumes),
  roadmaps: many(roadmaps),
  roadmapSubsections: many(roadmapSubsections),
  jobMatches: many(jobMatches),
  applications: many(applications),
  achievements: many(achievements),
  activities: many(activities),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  tailoredResumes: many(tailoredResumes),
}));

export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
  user: one(users, { fields: [roadmaps.userId], references: [users.id] }),
  subsections: many(roadmapSubsections),
}));

export const roadmapSubsectionsRelations = relations(roadmapSubsections, ({ one }) => ({
  roadmap: one(roadmaps, { fields: [roadmapSubsections.roadmapId], references: [roadmaps.id] }),
  user: one(users, { fields: [roadmapSubsections.userId], references: [users.id] }),
}));

export const jobMatchesRelations = relations(jobMatches, ({ one, many }) => ({
  user: one(users, { fields: [jobMatches.userId], references: [users.id] }),
  tailoredResumes: many(tailoredResumes),
  applications: many(applications),
}));

export const tailoredResumesRelations = relations(tailoredResumes, ({ one, many }) => ({
  user: one(users, { fields: [tailoredResumes.userId], references: [users.id] }),
  baseResume: one(resumes, { fields: [tailoredResumes.baseResumeId], references: [resumes.id] }),
  jobMatch: one(jobMatches, { fields: [tailoredResumes.jobMatchId], references: [jobMatches.id] }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  jobMatch: one(jobMatches, { fields: [applications.jobMatchId], references: [jobMatches.id] }),
  tailoredResume: one(tailoredResumes, { fields: [applications.tailoredResumeId], references: [tailoredResumes.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

// Atomic task schemas for AI-generated roadmaps
export const atomicTaskSchema = z.object({
  id: z.string().uuid().or(z.literal("")).transform(val => val || crypto.randomUUID()), // Auto-generate if missing
  title: z.string().min(5).max(60), // Enforce short, actionable titles
  description: z.string().min(10).max(140), // Twitter-length descriptions
  estimatedMinutes: z.number().min(20).max(60), // Bite-sized time commitment
  priority: z.enum(["high", "medium", "low"]),
  definitionOfDone: z.array(z.string().max(80)).min(3).max(5), // Clear completion criteria
  resources: z.array(z.object({
    title: z.string().max(50),
    url: z.string().url()
  })).max(2).default([]), // Optional resources, prevent overwhelm
  dependencies: z.array(z.string().uuid()).default([]), // Task IDs this depends on
  completed: z.boolean().default(false),
  completedAt: z.coerce.date().nullable().optional()
}).strict();

export const roadmapSubsectionSchema = z.object({
  id: z.string().uuid().or(z.literal("")).transform(val => val || crypto.randomUUID()), // Auto-generate if missing
  title: z.string().min(5).max(80),
  description: z.string().min(10).max(200), // Brief subsection overview
  tasks: z.array(atomicTaskSchema).min(3).max(5), // 3-5 tasks per subsection
  estimatedHours: z.number().min(1).max(5), // Total time for subsection
  priority: z.enum(["high", "medium", "low"])
}).strict();

export const atomicRoadmapSchema = z.object({
  phase: z.enum(["30_days", "3_months", "6_months"]), // Align with DB enum
  title: z.string().min(10).max(100),
  description: z.string().min(20).max(300),
  subsections: z.array(roadmapSubsectionSchema).min(4).max(6), // 4-6 subsections max
  estimatedWeeks: z.number().min(1).max(12)
}).strict();

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
});

export const insertRoadmapSchema = createInsertSchema(roadmaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoadmapSubsectionSchema = createInsertSchema(roadmapSubsections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobMatchSchema = createInsertSchema(jobMatches).omit({
  id: true,
  createdAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Roadmap = typeof roadmaps.$inferSelect;
export type InsertRoadmap = z.infer<typeof insertRoadmapSchema>;
export type RoadmapSubsection = typeof roadmapSubsections.$inferSelect;
export type InsertRoadmapSubsection = z.infer<typeof insertRoadmapSubsectionSchema>;
export type JobMatch = typeof jobMatches.$inferSelect;
export type InsertJobMatch = z.infer<typeof insertJobMatchSchema>;
export type TailoredResume = typeof tailoredResumes.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Resource = typeof resources.$inferSelect;
