import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { 
  GraduationCap, 
  TrendingUp, 
  Target, 
  FileText, 
  Briefcase, 
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Navigation Bar */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" data-testid="nav-button-login">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button data-testid="nav-button-signup">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Career Development
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Navigate Your Career Path
            <br />
            With Confidence
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your career journey with AI-powered insights, personalized roadmaps, 
            and intelligent job matching designed specifically for students and new graduates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 group" data-testid="hero-button-signup">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="hero-button-login">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">360°</div>
              <div className="text-sm text-muted-foreground">Career Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Free for Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need to Launch Your Career
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            From resume optimization to job matching, we provide comprehensive tools 
            to help you stand out and succeed.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <Card className="group hover:shadow-lg transition-all hover:scale-105" data-testid="feature-card-resume">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Resume Analysis</h3>
                <p className="text-muted-foreground">
                  Get instant feedback on your resume with AI-powered scoring and 
                  actionable improvement suggestions.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105" data-testid="feature-card-roadmap">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Personalized Roadmaps</h3>
                <p className="text-muted-foreground">
                  Create custom career development plans tailored to your goals, 
                  skills, and timeline.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105" data-testid="feature-card-jobs">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Job Matching</h3>
                <p className="text-muted-foreground">
                  Discover opportunities that align with your skills and career 
                  aspirations using AI.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105" data-testid="feature-card-projects">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Micro-Projects</h3>
                <p className="text-muted-foreground">
                  Build your portfolio with AI-generated project ideas designed 
                  for your target role.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105" data-testid="feature-card-tracking">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Application Tracking</h3>
                <p className="text-muted-foreground">
                  Organize and monitor your job applications with built-in 
                  progress tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all hover:scale-105" data-testid="feature-card-education">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Student-Focused</h3>
                <p className="text-muted-foreground">
                  Designed for educational institutions to support students 
                  throughout their career journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How Pathwise Works
          </h2>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
                <p className="text-muted-foreground">
                  Start by uploading your resume. Our AI instantly analyzes it, 
                  providing a detailed score and identifying areas for improvement.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Build Your Roadmap</h3>
                <p className="text-muted-foreground">
                  Create a personalized career development plan with milestones, 
                  skill-building activities, and timeline tracking.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Find Perfect Matches</h3>
                <p className="text-muted-foreground">
                  Discover jobs, internships, and opportunities that align with your 
                  skills and career goals through AI-powered matching.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Track & Succeed</h3>
                <p className="text-muted-foreground">
                  Monitor your applications, complete portfolio projects, and 
                  watch your career progress in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Start Your Career Journey?
              </h2>
              <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                Join thousands of students who are taking control of their career 
                development with Pathwise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/register">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="text-lg px-8 py-6 group"
                    data-testid="cta-button-signup"
                  >
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-6 bg-background/10 hover:bg-background/20 border-primary-foreground/20"
                    data-testid="cta-button-login"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why Students Choose Pathwise
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized recommendations based on advanced AI analysis 
                  of your skills and goals.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Comprehensive Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Everything you need in one place: resume analysis, roadmaps, 
                  job matching, and application tracking.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Portfolio Builder</h3>
                <p className="text-sm text-muted-foreground">
                  Generate role-specific micro-projects to build your portfolio 
                  and stand out to employers.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Real Opportunities</h3>
                <p className="text-sm text-muted-foreground">
                  Access real job postings, internships, and volunteer opportunities 
                  matched to your profile.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Institutional Support</h3>
                <p className="text-sm text-muted-foreground">
                  Backed by your educational institution with dedicated support 
                  and resources.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your career development with achievement badges and 
                  activity dashboards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Pathwise Institution Edition. 
              Empowering students to navigate their career paths.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
