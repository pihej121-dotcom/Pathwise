import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["student", "admin", "super_admin"]);
export const applicationStatusEnum = pgEnum("application_status", ["applied", "interviewed", "rejected", "offered"]);
export const roadmapPhaseEnum = pgEnum("roadmap_phase", ["30_days", "3_months", "6_months"]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);
export const licenseTypeEnum = pgEnum("license_type", ["per_student", "site"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "claimed", "expired"]);
export const opportunityTypeEnum = pgEnum("opportunity_type", ["volunteer", "internship", "hackathon", "competition", "apprenticeship", "externship"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "paid", "institutional"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "trialing", "incomplete"]);

// Institutions table for licensing management
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").unique(), // For domain allowlist
  contactEmail: text("contact_email").notNull(),
  contactName: text("contact_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  customBranding: jsonb("custom_branding"),
  allowedDomains: text("allowed_domains").array(), // Multiple email domains
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Institution licenses
export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  licenseType: licenseTypeEnum("license_type").notNull(),
  licensedSeats: integer("licensed_seats"), // null for site licenses
  usedSeats: integer("used_seats").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  brandingEnabled: boolean("branding_enabled").notNull().default(false),
  supportLevel: text("support_level").default("standard"), // standard, premium, enterprise
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"), // Additional license metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User invitations for controlled access
export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("student"),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  status: inviteStatusEnum("status").notNull().default("pending"),
  claimedBy: varchar("claimed_by").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Email verification tokens
export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  lastActiveAt: timestamp("last_active_at"),
  school: text("school"),
  major: text("major"),
  gradYear: integer("grad_year"),
  targetRole: text("target_role"),
  industries: text("industries").array(),
  targetCompanies: text("target_companies").array(),
  location: text("location"),
  remoteOk: boolean("remote_ok").default(false),
  // Subscription fields
  subscriptionTier: subscriptionTierEnum("subscription_tier").notNull().default("free"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
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

// Promo codes for free tier upgrades
export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("free_paid_tier"), // Type of benefit
  maxUses: integer("max_uses"), // null for unlimited
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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

// Micro-Internship Marketplace - Skill gap analysis
export const skillGapAnalyses = pgTable("skill_gap_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  resumeId: varchar("resume_id").references(() => resumes.id),
  jobMatchId: varchar("job_match_id").references(() => jobMatches.id),
  targetRole: text("target_role"),
  targetCompany: text("target_company"),
  missingSkills: text("missing_skills").array().notNull(),
  skillCategories: text("skill_categories").array(), // technical, soft, domain-specific
  priorityLevel: text("priority_level").notNull().default("medium"), // high, medium, low
  analysisSource: text("analysis_source").notNull(), // resume-only, job-match, manual
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Role-focused micro-projects for portfolio building
export const microProjects = pgTable("micro_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // Resume-friendly title
  description: text("description").notNull(), // 2-3 sentence project summary
  targetRole: text("target_role").notNull(), // e.g., "Data Scientist", "Product Manager"
  targetSkill: text("target_skill"), // Optional: specific skill this addresses
  skillCategory: text("skill_category"), // technical, soft, domain-specific
  difficultyLevel: text("difficulty_level").notNull().default("intermediate"), // beginner, intermediate, advanced
  estimatedHours: integer("estimated_hours").notNull().default(20), // Hours to complete (typically 10-40 for 1-2 weeks)
  projectType: text("project_type").notNull(), // data-analysis, coding, design, writing, research
  // Step-by-step deliverables with embedded resource links
  // Format: [{stepNumber, instruction, resourceLinks: [{title, url, type}]}]
  deliverables: jsonb("deliverables").notNull(), // Actionable steps with resource links
  skillsGained: text("skills_gained").array().notNull(), // Skills/tools demonstrated (e.g., "Python", "Pandas", "Scikit-learn")
  relevanceToRole: text("relevance_to_role").notNull(), // Why this matters for the target role
  // Legacy fields for backward compatibility
  datasetUrl: text("dataset_url"),
  templateUrl: text("template_url"), 
  repositoryUrl: text("repository_url"),
  tutorialUrl: text("tutorial_url"),
  instructions: jsonb("instructions"), // Deprecated in favor of deliverables
  evaluationCriteria: text("evaluation_criteria").array(),
  // Portfolio integration  
  portfolioTemplate: text("portfolio_template"), // How to present the artifact
  exampleArtifacts: text("example_artifacts").array(), // Links to example completions
  // Metadata
  tags: text("tags").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User project completions and progress
export const projectCompletions = pgTable("project_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => microProjects.id, { onDelete: "cascade" }),
  skillGapAnalysisId: varchar("skill_gap_analysis_id").references(() => skillGapAnalyses.id),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed, submitted
  progressPercentage: integer("progress_percentage").notNull().default(0), // 0-100
  timeSpent: integer("time_spent").default(0), // in minutes
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  submittedAt: timestamp("submitted_at"),
  // Completion artifacts
  artifactUrls: text("artifact_urls").array(), // Links to completed work
  reflectionNotes: text("reflection_notes"), // What the student learned
  selfAssessment: integer("self_assessment"), // 1-5 rating
  skillImprovement: text("skill_improvement"), // How it addressed the skill gap
  nextSteps: text("next_steps"), // What to do next
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Portfolio artifacts from completed projects
export const portfolioArtifacts = pgTable("portfolio_artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completionId: varchar("completion_id").notNull().references(() => projectCompletions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  artifactType: text("artifact_type").notNull(), // code, analysis, design, report, dashboard
  fileUrl: text("file_url"),
  previewUrl: text("preview_url"), // Screenshot or preview image
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  // Portfolio presentation
  displayOrder: integer("display_order").default(0),
  isPublic: boolean("is_public").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  tags: text("tags").array(),
  technologiesUsed: text("technologies_used").array(),
  skillsDemonstrated: text("skills_demonstrated").array(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Beyond Jobs - Non-traditional opportunities
export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  organization: text("organization").notNull(),
  type: opportunityTypeEnum("type").notNull(), // volunteer, internship, hackathon, competition, apprenticeship, externship
  location: text("location"),
  isRemote: boolean("is_remote").default(false),
  compensation: text("compensation"), // 'paid', 'unpaid', 'stipend', 'academic-credit'
  requirements: text("requirements").array(),
  skills: text("skills").array(),
  applicationUrl: text("application_url"),
  contactEmail: text("contact_email"),
  deadline: timestamp("deadline"),
  postedDate: timestamp("posted_date").notNull().default(sql`now()`),
  source: text("source").notNull(), // API source identifier
  externalId: text("external_id"), // Original ID from source API
  isActive: boolean("is_active").default(true),
  tags: text("tags").array(),
  estimatedHours: integer("estimated_hours"),
  duration: text("duration"), // 'semester', 'summer', 'ongoing', 'one-time'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User saved opportunities
export const savedOpportunities = pgTable("saved_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  opportunityId: varchar("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  savedAt: timestamp("saved_at").notNull().default(sql`now()`),
  notes: text("notes"),
});

// Tour completions for tracking user progress through interactive product tours
export const tourCompletions = pgTable("tour_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tourId: text("tour_id").notNull(),
  completedAt: timestamp("completed_at").notNull().default(sql`now()`),
});

// Relations
export const institutionsRelations = relations(institutions, ({ many, one }) => ({
  licenses: many(licenses),
  users: many(users),
  invitations: many(invitations),
}));

export const licensesRelations = relations(licenses, ({ one }) => ({
  institution: one(institutions, { fields: [licenses.institutionId], references: [institutions.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  institution: one(institutions, { fields: [invitations.institutionId], references: [institutions.id] }),
  invitedByUser: one(users, { fields: [invitations.invitedBy], references: [users.id] }),
  claimedByUser: one(users, { fields: [invitations.claimedBy], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  institution: one(institutions, { fields: [users.institutionId], references: [institutions.id] }),
  sessions: many(sessions),
  resumes: many(resumes),
  roadmaps: many(roadmaps),
  roadmapSubsections: many(roadmapSubsections),
  jobMatches: many(jobMatches),
  applications: many(applications),
  achievements: many(achievements),
  activities: many(activities),
  savedOpportunities: many(savedOpportunities),
  tourCompletions: many(tourCompletions),
  sentInvitations: many(invitations, { relationName: "invitedBy" }),
  claimedInvitations: many(invitations, { relationName: "claimedBy" }),
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

export const opportunitiesRelations = relations(opportunities, ({ many }) => ({
  savedByUsers: many(savedOpportunities),
}));

export const savedOpportunitiesRelations = relations(savedOpportunities, ({ one }) => ({
  user: one(users, { fields: [savedOpportunities.userId], references: [users.id] }),
  opportunity: one(opportunities, { fields: [savedOpportunities.opportunityId], references: [opportunities.id] }),
}));

export const tourCompletionsRelations = relations(tourCompletions, ({ one }) => ({
  user: one(users, { fields: [tourCompletions.userId], references: [users.id] }),
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
export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentUses: true,
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

// Micro-Internship Marketplace schemas
export const insertSkillGapAnalysisSchema = createInsertSchema(skillGapAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertMicroProjectSchema = createInsertSchema(microProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectCompletionSchema = createInsertSchema(projectCompletions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioArtifactSchema = createInsertSchema(portfolioArtifacts).omit({
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
  invitationToken: z.string().optional(),
  selectedPlan: z.enum(['free', 'paid']).optional(),
  promoCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["student", "admin"]).default("student"),
  institutionId: z.string().min(1), // Allow both UUID and demo string IDs
});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

// Types
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
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

// AI Analysis Schemas
export const jobMatchAnalysisSchema = z.object({
  overallMatch: z.number().int().min(1).max(100),
  competitivenessBand: z.enum(["Exceptional", "Strong", "Good", "Fair", "Weak", "Poor"]),
  strengths: z.array(z.string()).min(1),
  concerns: z.array(z.string()),
  skillsAnalysis: z.object({
    strongMatches: z.array(z.string()),
    partialMatches: z.array(z.string()),
    missingSkills: z.array(z.string()),
    explanation: z.string().min(50)
  }),
  experienceAnalysis: z.object({
    relevantExperience: z.array(z.string()),
    experienceGaps: z.array(z.string()),
    explanation: z.string().min(50)
  }),
  recommendations: z.array(z.string()).min(1),
  nextSteps: z.array(z.string()).min(1)
});

export type JobMatchAnalysis = z.infer<typeof jobMatchAnalysisSchema>;

// Competitiveness band utility function
export function getCompetitivenessBand(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Weak";
  return "Poor";
}

// Opportunity Zod Schemas
export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  postedDate: true,
});

export const insertSavedOpportunitySchema = createInsertSchema(savedOpportunities).omit({
  id: true,
  savedAt: true,
});

export const insertTourCompletionSchema = createInsertSchema(tourCompletions).omit({
  id: true,
  completedAt: true,
});

export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type SelectOpportunity = typeof opportunities.$inferSelect;
export type InsertSavedOpportunity = z.infer<typeof insertSavedOpportunitySchema>;
export type SelectSavedOpportunity = typeof savedOpportunities.$inferSelect;
export type TourCompletion = typeof tourCompletions.$inferSelect;
export type InsertTourCompletion = z.infer<typeof insertTourCompletionSchema>;

// Micro-Internship Marketplace types
export type SkillGapAnalysis = typeof skillGapAnalyses.$inferSelect;
export type InsertSkillGapAnalysis = z.infer<typeof insertSkillGapAnalysisSchema>;
export type MicroProject = typeof microProjects.$inferSelect;
export type InsertMicroProject = z.infer<typeof insertMicroProjectSchema>;
export type ProjectCompletion = typeof projectCompletions.$inferSelect;
export type InsertProjectCompletion = z.infer<typeof insertProjectCompletionSchema>;
export type PortfolioArtifact = typeof portfolioArtifacts.$inferSelect;
export type InsertPortfolioArtifact = z.infer<typeof insertPortfolioArtifactSchema>;
