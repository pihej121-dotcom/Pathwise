# Overview

Pathwise Institution Edition is a comprehensive career development platform designed for educational institutions. The application helps students analyze their resumes, create personalized career roadmaps, find job matches, and track their application progress. Built as a full-stack web application, it leverages AI to provide intelligent career guidance and resume analysis.

## Recent Changes (September 2025)

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