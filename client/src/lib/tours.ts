import Shepherd from "shepherd.js";

export type TourStep = {
  id: string;
  title?: string;
  text: string;
  attachTo?: {
    element: string;
    on: string;
  };
  buttons?: Array<{
    text: string;
    action?: () => void;
    classes?: string;
  }>;
};

export type TourConfig = {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
};

// Common button configurations
const buttons = {
  back: {
    text: "Back",
    action: function (this: any) {
      this.back();
    },
  },
  next: {
    text: "Next",
    action: function (this: any) {
      this.next();
    },
  },
  finish: {
    text: "Finish",
    action: function (this: any) {
      this.complete();
    },
  },
  skip: {
    text: "Skip Tour",
    classes: "shepherd-button-secondary",
    action: function (this: any) {
      this.cancel();
    },
  },
};

// Dashboard Welcome Tour (FREE)
export const dashboardTour: TourConfig = {
  id: "dashboard-welcome",
  title: "Welcome to Your Career Dashboard",
  description: "Let's take a quick tour of your career development hub",
  steps: [
    {
      id: "welcome",
      title: "Welcome! 👋",
      text: "This is your Career Dashboard - your central hub for tracking progress, analyzing your resume, and building your career path. Let's take a quick tour!",
      buttons: [buttons.skip, buttons.next],
    },
    {
      id: "rms-score",
      title: "Resume Match Score",
      text: "Your Resume Match Score (RMS) shows how well your resume aligns with your target role. Higher scores mean better job matches. Upload your resume to get started!",
      attachTo: {
        element: "[data-testid='rms-score']",
        on: "bottom",
      },
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "streak",
      title: "Daily Streak",
      text: "Build momentum by logging in daily and completing career development tasks. Your streak helps you stay consistent!",
      attachTo: {
        element: "[data-testid='streak-counter']",
        on: "left",
      },
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "quick-actions",
      title: "Quick Actions",
      text: "Use these quick action buttons to jump directly to key features like uploading your resume, generating roadmaps, or chatting with the AI Copilot.",
      buttons: [buttons.back, buttons.skip, buttons.finish],
    },
  ],
};

// Resume Analysis Tour (FREE)
export const resumeAnalysisTour: TourConfig = {
  id: "resume-analysis",
  title: "Resume Analysis Guide",
  description: "Learn how to analyze and improve your resume with AI",
  steps: [
    {
      id: "upload-intro",
      title: "Resume Analysis",
      text: "Upload your resume here to get instant AI-powered feedback on how well it matches your target role. We support PDF and DOCX formats.",
      buttons: [buttons.skip, buttons.next],
    },
    {
      id: "target-role",
      title: "Target Role & Industry",
      text: "Specify your target role and industry for more accurate, personalized analysis. This helps our AI compare your resume against real job requirements.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "analysis-results",
      title: "Understanding Your Scores",
      text: "After analysis, you'll see detailed scores for Skills, Experience, Keywords, Education, and Certifications. Each section includes specific recommendations for improvement.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "gaps-insights",
      title: "Skills Gaps & Action Plan",
      text: "We'll identify specific gaps between your resume and target role, then provide actionable resources and steps to close those gaps.",
      buttons: [buttons.back, buttons.skip, buttons.finish],
    },
  ],
};

// AI Copilot Tour (FREE)
export const aiCopilotTour: TourConfig = {
  id: "ai-copilot",
  title: "AI Career Copilot Guide",
  description: "Learn how to get personalized career advice from your AI assistant",
  steps: [
    {
      id: "copilot-intro",
      title: "Your AI Career Assistant",
      text: "The AI Copilot provides personalized career advice, resume tips, interview prep, and salary negotiation strategies. Think of it as your 24/7 career coach!",
      buttons: [buttons.skip, buttons.next],
    },
    {
      id: "quick-actions",
      title: "Quick Action Buttons",
      text: "Use these quick action buttons to get instant help with common career tasks like resume tailoring, cover letters, and interview preparation.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "chat-input",
      title: "Ask Anything",
      text: "Type your career questions here. You can ask about resume improvements, career transitions, interview strategies, salary negotiations, and more!",
      buttons: [buttons.back, buttons.skip, buttons.finish],
    },
  ],
};

// Career Roadmap Tour (PAID)
export const careerRoadmapTour: TourConfig = {
  id: "career-roadmap",
  title: "Career Roadmap Guide",
  description: "Learn how to use your personalized career development plan",
  steps: [
    {
      id: "roadmap-intro",
      title: "Your Personalized Roadmap",
      text: "Career Roadmaps break down your career goals into actionable 30-day, 3-month, and 6-month plans. Each plan includes specific tasks, resources, and milestones.",
      buttons: [buttons.skip, buttons.next],
    },
    {
      id: "generate-roadmap",
      title: "Generate Your Roadmap",
      text: "Click here to generate a personalized roadmap based on your resume analysis and target role. Our AI creates a custom plan tailored to your needs.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "track-progress",
      title: "Track Your Progress",
      text: "Check off tasks as you complete them. The progress bar shows how far you've come and helps you stay motivated!",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "tasks-resources",
      title: "Tasks & Resources",
      text: "Each task includes specific actions to take and curated resources to help you succeed. Click on any task to see details and mark it complete.",
      buttons: [buttons.back, buttons.skip, buttons.finish],
    },
  ],
};

// Job Matching Tour (PAID)
export const jobMatchingTour: TourConfig = {
  id: "job-matching",
  title: "AI Job Matching Guide",
  description: "Find jobs that match your skills and experience",
  steps: [
    {
      id: "search-intro",
      title: "Smart Job Search",
      text: "Search for jobs using keywords, location, and filters. Our AI analyzes each job against your resume to show compatibility scores.",
      buttons: [buttons.skip, buttons.next],
    },
    {
      id: "search-filters",
      title: "Refine Your Search",
      text: "Use these filters to narrow down results by location, salary range, and other criteria. Find jobs that truly match what you're looking for.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "compatibility-score",
      title: "AI Compatibility Score",
      text: "Each job shows a compatibility percentage. Higher scores mean your resume is a better match. Click 'AI Match Analysis' for detailed insights.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "job-actions",
      title: "Job Actions",
      text: "Bookmark interesting jobs to review later. You can also tailor your resume specifically for high-match positions.",
      buttons: [buttons.back, buttons.skip, buttons.finish],
    },
  ],
};

// Micro-Projects Tour (PAID)
export const microProjectsTour: TourConfig = {
  id: "micro-projects",
  title: "Micro-Projects Guide",
  description: "Build portfolio projects to close skills gaps",
  steps: [
    {
      id: "projects-intro",
      title: "Build Your Portfolio",
      text: "Micro-Projects are small, focused projects designed to close skills gaps and create portfolio-worthy work. Each project takes 1-2 weeks to complete.",
      buttons: [buttons.skip, buttons.next],
    },
    {
      id: "project-recommendations",
      title: "Personalized Recommendations",
      text: "Projects are recommended based on your resume analysis and target role. They're designed to address your specific skills gaps.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "project-details",
      title: "Step-by-Step Instructions",
      text: "Each project includes detailed steps, estimated time, required skills, and curated resources to help you succeed.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "track-completion",
      title: "Track Your Progress",
      text: "Mark projects as started, in progress, or completed. Build a portfolio of finished work to showcase to employers!",
      buttons: [buttons.back, buttons.skip, buttons.finish],
    },
  ],
};

// Applications Tracker Tour (PAID)
export const applicationsTour: TourConfig = {
  id: "applications-tracker",
  title: "Application Tracking Guide",
  description: "Organize and track your job applications",
  steps: [
    {
      id: "tracker-intro",
      title: "Application Tracker",
      text: "Keep all your job applications organized in one place. Track status, add notes, and never lose track of where you applied.",
      buttons: [buttons.skip, buttons.next],
    },
    {
      id: "add-application",
      title: "Add New Applications",
      text: "Click here to manually add an application, or apply directly through matched jobs to automatically track them.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "status-updates",
      title: "Update Application Status",
      text: "Update application status as you progress: Applied → Interviewed → Offered or Rejected. This helps you track your success rate.",
      buttons: [buttons.back, buttons.skip, buttons.next],
    },
    {
      id: "application-notes",
      title: "Add Notes & Reminders",
      text: "Add notes about interviews, follow-ups, or any important details. Stay organized throughout your job search!",
      buttons: [buttons.back, buttons.skip, buttons.finish],
    },
  ],
};

// Export all tours
export const tours: Record<string, TourConfig> = {
  "dashboard-welcome": dashboardTour,
  "resume-analysis": resumeAnalysisTour,
  "ai-copilot": aiCopilotTour,
  "career-roadmap": careerRoadmapTour,
  "job-matching": jobMatchingTour,
  "micro-projects": microProjectsTour,
  "applications-tracker": applicationsTour,
};
