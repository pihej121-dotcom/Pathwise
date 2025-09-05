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
import { FileText, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
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
      <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <CardHeader className="text-center pb-8">
          <CardTitle className="flex items-center justify-center gap-3 text-xl">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            Resume Progress Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
            <p className="text-base mb-1">Upload and analyze a resume to see your progress over time</p>
            <p className="text-sm">Track improvements across different resume versions</p>
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
        <div className="bg-white dark:bg-gray-800 border-0 rounded-xl p-4 shadow-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{data.fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{data.displayDate}</p>
            </div>
            {data.isActive && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs px-2 py-0.5">
                Current
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Overall Score</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.rmsScore}/100</span>
              </div>
            </div>
            
            {showSectionScores && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-purple-50 dark:bg-purple-900 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-purple-700 dark:text-purple-300">Skills</span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{data.skillsScore}</span>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700 dark:text-green-300">Experience</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{data.experienceScore}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-yellow-700 dark:text-yellow-300">Keywords</span>
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{data.keywordsScore}</span>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-700 dark:text-red-300">Education</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{data.educationScore}</span>
                  </div>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-900 rounded p-2 col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-cyan-700 dark:text-cyan-300">Certifications</span>
                    <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{data.certificationsScore}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 border-0 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Resume Progress Analytics
              </span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Track your resume improvements over time
              </p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {/* Latest Score Display */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl px-6 py-4 text-white shadow-lg">
              <div className="text-center">
                <div className="text-xs font-medium opacity-90 mb-1">Latest Score</div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">{latestScore}</span>
                  <span className="text-sm opacity-75">/100</span>
                </div>
                {scoreChange !== 0 && (
                  <div className={`flex items-center justify-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    scoreChange > 0 
                      ? 'bg-green-500 bg-opacity-20 text-green-100' 
                      : scoreChange < 0 
                      ? 'bg-red-500 bg-opacity-20 text-red-100' 
                      : 'bg-gray-500 bg-opacity-20 text-gray-100'
                  }`}>
                    {scoreChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : scoreChange < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    <span>{scoreChange > 0 ? '+' : ''}{scoreChange}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Toggle Button */}
            <Button
              variant={showSectionScores ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSectionScores(!showSectionScores)}
              data-testid="toggle-section-scores"
              className={showSectionScores 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg border-0" 
                : "border-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
              }
            >
              {showSectionScores ? (
                <>
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-inner border border-gray-100 dark:border-gray-800">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="overallGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#E5E7EB" 
                  className="opacity-30" 
                />
                
                <XAxis 
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  stroke="#9CA3AF"
                />
                
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ 
                    value: 'Score', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' }
                  }}
                  stroke="#9CA3AF"
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px',
                    color: '#6B7280'
                  }}
                />
                
                {/* Overall Score - main line with gradient */}
                <Line
                  type="monotone"
                  dataKey="rmsScore"
                  stroke="url(#gradientBlue)"
                  strokeWidth={4}
                  dot={{ 
                    fill: "#3B82F6", 
                    strokeWidth: 3, 
                    r: 8,
                    stroke: "#FFFFFF"
                  }}
                  activeDot={{ 
                    r: 12, 
                    stroke: "#3B82F6", 
                    strokeWidth: 4,
                    fill: "#FFFFFF",
                    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                  }}
                  name="Overall Score"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                />
                
                {/* Section scores with improved styling */}
                {showSectionScores && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="skillsScore"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 5, stroke: "#FFFFFF" }}
                      activeDot={{ r: 8, stroke: "#8B5CF6", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Skills"
                      strokeDasharray="8 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="experienceScore"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 5, stroke: "#FFFFFF" }}
                      activeDot={{ r: 8, stroke: "#10B981", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Experience"
                      strokeDasharray="8 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="keywordsScore"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: "#F59E0B", strokeWidth: 2, r: 5, stroke: "#FFFFFF" }}
                      activeDot={{ r: 8, stroke: "#F59E0B", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Keywords"
                      strokeDasharray="8 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="educationScore"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: "#EF4444", strokeWidth: 2, r: 5, stroke: "#FFFFFF" }}
                      activeDot={{ r: 8, stroke: "#EF4444", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Education"
                      strokeDasharray="8 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="certificationsScore"
                      stroke="#06B6D4"
                      strokeWidth={3}
                      dot={{ fill: "#06B6D4", strokeWidth: 2, r: 5, stroke: "#FFFFFF" }}
                      activeDot={{ r: 8, stroke: "#06B6D4", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Certifications"
                      strokeDasharray="8 4"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {chartData.length > 1 && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-full px-4 py-2 border border-blue-200 dark:border-blue-800">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Tracking progress across {chartData.length} resume versions
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}