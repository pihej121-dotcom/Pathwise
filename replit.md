# Overview

Pathwise Institution Edition is a comprehensive career development platform designed for educational institutions. The application helps students analyze their resumes, create personalized career roadmaps, find job matches, and track their application progress. Built as a full-stack web application, it leverages AI to provide intelligent career guidance and resume analysis.

## Replit Environment Setup (October 2025)

### Initial Configuration
- **Database**: PostgreSQL database created and configured using Replit's built-in database service
- **Schema**: Successfully pushed to database using `npm run db:push`
- **Workflow**: Configured to run on port 5000 with webview output type
- **Development Server**: Express + Vite running on 0.0.0.0:5000 with allowedHosts enabled
- **Deployment**: Configured for Replit Autoscale with build and start commands

### Known Warnings (Non-Critical)
- **CoreSignal API**: API key not configured (optional service for additional internship data)
- **Adzuna API**: Credentials not configured (optional fallback for job search)
- **Working Services**: GitHub SimplifyJobs (internships) and VolunteerConnector (volunteer) are fully operational

### Demo Data
- Database automatically seeds with demo institution, admin user, and student user on first run
- Seeding only occurs when database is empty

## Recent Changes (September 2025 - October 2025)

### Tabbed Dashboard - Single-Page Experience (October 2025)
- **Purpose**: Eliminate navigation complexity - all features accessible from one dashboard page
- **Implementation**: Tabbed Dashboard where ALL features are embedded without page navigation
- **Key Changes**:
  - Dashboard.tsx redesigned with shadcn Tabs component - 8 tabs total (Overview + 7 features)
  - All feature components updated to support embedded mode with conditional Layout rendering
  - Features: Resume Analysis, Career Roadmap, Job Matching, Micro-Projects, AI Copilot, Applications, Interview Prep
  - User stays on `/dashboard` route - tab switching changes content without navigation
  - JobMatching routing logic gated behind embedded flag to prevent URL mutations
- **Technical Pattern**:
  - Each component accepts `embedded` prop (default false)
  - When `embedded=true`: renders content without Layout wrapper
  - When `embedded=false`: renders with Layout wrapper (for standalone routes)
  - Prevents Layout nesting while maintaining standalone functionality
- **User Experience**: 
  - Login → Dashboard → Select any tab → Content appears instantly (no page load)
  - Truly single-page experience - everything stays on the dashboard
  - Standalone routes still work for direct access (e.g., `/resume`, `/jobs`)
- **Benefits**: 
  - Zero navigation friction - all features one tab click away
  - Faster switching between features (no page reloads)
  - Cleaner URL structure (stays on `/dashboard`)
  - All functionality preserved with backward compatibility

### Resume Analysis Paywall (October 2025)
- **Purpose**: Monetization strategy to convert free users to Pro subscription
- **Restricted Features for Free Users**:
  - Sub-score details (Skills, Experience, Education, Keywords analysis) - blurred with upgrade overlay
  - Improvement Recommendations section - blurred with upgrade overlay
  - Overall resume score and upload functionality remain accessible to free users
- **Component**: `PaywallOverlay.tsx` - reusable component with blur effect and "Unlock with Pro" message
- **User Experience**: 
  - Free users see blurred content when clicking sub-score cards
  - "Upgrade to Pro" button redirects to Stripe checkout for $10/month subscription
  - Clear visual hierarchy with lock icon and value proposition
- **Implementation**: Uses `useAuth` hook to check `subscriptionTier` and conditionally render paywall
- **Stripe Integration**: Upgrade button calls `/api/stripe/create-checkout-session` endpoint

### Landing Page Subscription Plans (October 2025)
- **Updated Hero Stats**: Replaced generic "100% Free for Students" stat with detailed subscription plan cards
- **Three-Tier Display**:
  - Institutional: Full access for invited students with institution branding
  - Free ($0): Resume Analysis with AI and AI Career Co-Pilot
  - Pro ($10/month): Full feature access marked as "Most Popular"
- **Feature Breakdowns**: Each plan shows specific features with checkmark bullets
- **Design**: Card-based layout with icons, pricing, and feature lists for easy comparison

### Professional Landing Page
- **Purpose**: Provide a welcoming entry point for new users before authentication
- **Design**: Modern, professional landing page with gradient hero section and feature showcase
- **Key Sections**:
  - Navigation bar with Sign In and Get Started buttons
  - Hero section with compelling headline and value proposition
  - Stats display (AI Powered, 360° Career Support, 100% Free for Students)
  - Feature cards highlighting core platform capabilities (Resume Analysis, Roadmaps, Job Matching, Micro-Projects, etc.)
  - Step-by-step "How It Works" guide
  - Benefits grid with checkmarks for key selling points
  - Call-to-action sections with prominent signup buttons
  - Professional footer with branding
- **Routing**: Root path (/) now displays landing page for unauthenticated users; authenticated users redirected to role-based dashboards
- **Component**: `LandingPage.tsx` with full responsive design and consistent theming

### User Settings & Profile Management
- **Component**: UserSettingsDialog with form validation for profile editing
- **Editable Fields**: firstName, lastName, school, major, gradYear, targetRole, location, remoteOk
- **API**: PATCH /api/users/settings endpoint for authenticated profile updates
- **Access**: Settings dialog accessible via gear icon in sidebar
- **Validation**: Zod schemas ensure data integrity

### Micro-Projects Feature - Role-Based AI Generation
- **Purpose**: Generate portfolio-ready micro-projects (1-2 weeks) tailored to specific career roles
- **AI Generation**: Role-based project creation using OpenAI GPT-4o-mini with structured deliverables
- **Schema Updates**: Added `targetRole`, `skillsGained`, `relevanceToRole` fields; restructured deliverables as step objects with embedded resource links
- **Key Features**:
  - Target role input (e.g., "Data Scientist", "Product Manager")
  - Generates 1-3 projects per role with actionable steps
  - Each project includes: numbered deliverables with clickable resource links, skills gained badges, relevance explanation
  - Portfolio-ready outcomes with real datasets/APIs/resources (no mock data)
- **API Endpoint**: `/api/micro-projects/generate-from-role` accepts `targetRole` and `count` parameters
- **UI Components**: Enhanced project cards displaying structured deliverables, resource links with type badges, skills gained, and role relevance
- **Backward Compatibility**: Legacy skill-gap-based generation still supported alongside new role-based approach

### Beyond Jobs Feature - Tabbed Interface
- **UI Restructure**: "Beyond Jobs" is now a sub-tab under "Job Matching" instead of a separate page
- **Navigation**: Uses shadcn Tabs component with two tabs: "AI Job Matching" and "Beyond Jobs"
- **Routing**: Both /jobs and /beyond-jobs routes now point to the same JobMatching component
  - /beyond-jobs automatically selects the "Beyond Jobs" tab
  - Query parameter ?tab=beyond-jobs can be used to select the tab
- **Components**:
  - `JobMatching.tsx` - Parent wrapper with Layout and Tabs
  - `AIJobMatching.tsx` - AI-powered job matching tab (child component, no Layout)
  - `BeyondJobsTab.tsx` - Experiential opportunities tab (child component, no Layout)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: shadcn/ui components built on top of Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack React Query for server state management and API interactions
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **API Design**: RESTful API endpoints with JSON responses
- **Authentication**: JWT-based sessions with bcrypt password hashing, single session per user
- **Middleware**: Custom authentication middleware for protected routes

## Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive schema including users, sessions, resumes, roadmaps, job matches, applications, and activities
- **Migrations**: Drizzle Kit for database schema management

## File Storage
- **Primary**: AWS S3 with pre-signed URLs for secure file uploads
- **PDF Processing**: pdf-parse for text extraction with AWS Textract as fallback (feature flagged)
- **Upload Interface**: Uppy.js for modern file upload experience

## AI Integration
- **Provider**: OpenAI GPT-5 for resume analysis and career guidance
- **Features**: Resume scoring, gap analysis, personalized roadmap generation, and job matching insights
- **Architecture**: Server-side only AI processing for security and cost control

## Authentication & Authorization
- **Registration**: Invite-only or domain allowlist with email verification
- **Roles**: Student and admin roles with different permission levels
- **Sessions**: Secure session management with automatic token refresh
- **Optional**: SSO (OIDC/SAML) and LTI 1.3 integration support

## Security Features
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Single active session per user with token expiration
- **File Security**: Pre-signed URLs for secure S3 access
- **Input Validation**: Zod schemas for runtime type checking

# External Dependencies

## Core Services
- **Database**: Neon PostgreSQL serverless database
- **File Storage**: AWS S3 for resume and document storage
- **AI Processing**: OpenAI API for intelligent resume analysis and career guidance
- **Email**: Resend for transactional emails and magic link authentication

## Optional Integrations
- **OCR Fallback**: AWS Textract for PDF text extraction when pdf-parse fails
- **Job Data**: 
  - Adzuna API for job search and matching (free tier with API key)
  - CoreSignal API for internship data (free tier, requires special two-step API process)
  - GitHub SimplifyJobs for tech internships (free, no API key required)
  - VolunteerConnector for volunteer opportunities (free, no API key required)
- **Authentication**: OIDC/SAML providers for enterprise SSO
- **LMS Integration**: LTI 1.3 for learning management system compatibility

## Beyond Jobs - Experiential Opportunities
- **Purpose**: Match students with non-traditional career development opportunities
- **Opportunity Types**: Volunteer work, internships, hackathons, competitions, apprenticeships, externships
- **Data Sources**: 
  - CoreSignal API (internships) - Uses 'ApiKey' header with two-step process (search IDs → collect details)
  - VolunteerConnector (volunteer opportunities) - Returns data in `results` field
  - GitHub SimplifyJobs (tech internships) - Publicly available JSON feed
- **Features**:
  - Location-based filtering with smart abbreviation handling (NY→New York, SF→San Francisco, etc.)
  - Result shuffling for diversity (prevents always showing the same opportunities)
  - Save/bookmark functionality integrated with user profile
  - Remote work filtering
  - Type-specific filtering (volunteer, internship, hackathon, etc.)

## Development Tools
- **Build System**: Vite with React plugin for fast development
- **Deployment**: Replit Autoscale for hosting and scaling
- **Development**: Replit-specific plugins for enhanced development experience

## UI Components
- **Component Library**: Radix UI primitives for accessibility-first components
- **Icons**: Lucide React for consistent iconography
- **Styling**: Tailwind CSS with custom design tokens and CSS variables