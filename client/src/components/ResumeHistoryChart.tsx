import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import type { Resume } from "@shared/schema";

interface ResumeHistoryChartProps {
  resumes: Resume[];
  activeResumeId?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  fileName: string;
  rmsScore: number;
  skillsScore: number;
  experienceScore: number;
  keywordsScore: number;
  educationScore: number;
  certificationsScore: number;
  isActive: boolean;
}

export function ResumeHistoryChart({ resumes, activeResumeId }: ResumeHistoryChartProps) {
  const [showSectionScores, setShowSectionScores] = useState(false);

  // Transform resume data for the chart
  const chartData: ChartDataPoint[] = resumes
    .filter(resume => resume.rmsScore !== null)
    .map(resume => ({
      date: new Date(resume.createdAt).toISOString(),
      displayDate: format(new Date(resume.createdAt), "MMM d, h:mm a"),
      fileName: resume.fileName,
      rmsScore: resume.rmsScore || 0,
      skillsScore: resume.skillsScore || 0,
      experienceScore: resume.experienceScore || 0,
      keywordsScore: resume.keywordsScore || 0,
      educationScore: resume.educationScore || 0,
      certificationsScore: resume.certificationsScore || 0,
      isActive: resume.id === activeResumeId,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resume Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analyzed resumes yet</p>
            <p className="text-sm">Upload and analyze a resume to see your progress over time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestScore = chartData[chartData.length - 1]?.rmsScore || 0;
  const previousScore = chartData.length > 1 ? chartData[chartData.length - 2]?.rmsScore || 0 : latestScore;
  const scoreChange = latestScore - previousScore;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fileName}</p>
          <p className="text-sm text-muted-foreground mb-2">{data.displayDate}</p>
          {data.isActive && (
            <Badge variant="default" className="mb-2">Active</Badge>
          )}
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Overall Score:</span> {data.rmsScore}/100
            </p>
            {showSectionScores && (
              <>
                <p className="text-sm">Skills: {data.skillsScore}/100</p>
                <p className="text-sm">Experience: {data.experienceScore}/100</p>
                <p className="text-sm">Keywords: {data.keywordsScore}/100</p>
                <p className="text-sm">Education: {data.educationScore}/100</p>
                <p className="text-sm">Certifications: {data.certificationsScore}/100</p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resume Progress
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Latest:</span>
              <span className="font-bold text-lg">{latestScore}/100</span>
              {scoreChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  scoreChange > 0 ? 'text-green-600' : scoreChange < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {scoreChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : scoreChange < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {scoreChange > 0 ? '+' : ''}{scoreChange}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSectionScores(!showSectionScores)}
              data-testid="toggle-section-scores"
            >
              {showSectionScores ? 'Hide' : 'Show'} Section Scores
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Overall Score - always visible */}
              <Line
                type="monotone"
                dataKey="rmsScore"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                name="Overall Score"
              />
              
              {/* Section scores - only when toggled */}
              {showSectionScores && (
                <>
                  <Line
                    type="monotone"
                    dataKey="skillsScore"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8", r: 4 }}
                    name="Skills"
                  />
                  <Line
                    type="monotone"
                    dataKey="experienceScore"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ fill: "#82ca9d", r: 4 }}
                    name="Experience"
                  />
                  <Line
                    type="monotone"
                    dataKey="keywordsScore"
                    stroke="#ffc658"
                    strokeWidth={2}
                    dot={{ fill: "#ffc658", r: 4 }}
                    name="Keywords"
                  />
                  <Line
                    type="monotone"
                    dataKey="educationScore"
                    stroke="#ff7c7c"
                    strokeWidth={2}
                    dot={{ fill: "#ff7c7c", r: 4 }}
                    name="Education"
                  />
                  <Line
                    type="monotone"
                    dataKey="certificationsScore"
                    stroke="#8dd1e1"
                    strokeWidth={2}
                    dot={{ fill: "#8dd1e1", r: 4 }}
                    name="Certifications"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length > 1 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing progress across {chartData.length} resume versions
          </div>
        )}
      </CardContent>
    </Card>
  );
}