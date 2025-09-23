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
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, TrendingDown, Minus, BarChart3, Sparkles } from "lucide-react";
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
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            Resume Progress Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileText className="h-10 w-10 text-blue-500" />
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
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 rounded-2xl p-5 shadow-2xl border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{data.fileName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{data.displayDate}</p>
            </div>
            {data.isActive && (
              <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs px-3 py-1 animate-pulse">
                ✨ Current
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-200/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Overall Score
                </span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {data.rmsScore}/100
                </span>
              </div>
            </div>
            
            {showSectionScores && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/40 rounded-xl p-3 border border-purple-200/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Skills</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.skillsScore}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 rounded-xl p-3 border border-green-200/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Experience</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{data.experienceScore}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/40 rounded-xl p-3 border border-yellow-200/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Keywords</span>
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{data.keywordsScore}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/40 rounded-xl p-3 border border-red-200/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">Education</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{data.educationScore}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/40 rounded-xl p-3 border border-cyan-200/30 col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Certifications</span>
                    <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{data.certificationsScore}</span>
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

  // Custom Dot Component with enhanced styling
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <g>
        {/* Outer glow */}
        <circle
          cx={cx}
          cy={cy}
          r={15}
          fill="url(#dotGlow)"
          opacity={0.3}
          className="animate-pulse"
        />
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="url(#dotGradient)"
          stroke="#ffffff"
          strokeWidth={3}
          className="drop-shadow-lg"
        />
        {/* Center highlight */}
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill="#ffffff"
          opacity={0.9}
        />
        {/* Active indicator */}
        {payload.isActive && (
          <circle
            cx={cx}
            cy={cy}
            r={12}
            fill="none"
            stroke="url(#activeGradient)"
            strokeWidth={2}
            strokeDasharray="4 4"
            className="animate-spin"
            style={{ animationDuration: '3s' }}
          />
        )}
      </g>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/80 dark:from-gray-900 dark:via-blue-950/30 dark:to-indigo-950/50 border-0 shadow-2xl backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-4 text-xl">
            <div className="p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-lg animate-pulse">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent text-2xl font-bold">
                Resume Progress Analytics
              </span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Track your resume improvements over time
              </p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-4">
            {/* Enhanced Latest Score Display */}
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl px-8 py-6 text-white shadow-2xl relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
              <div className="relative text-center">
                <div className="text-xs font-medium opacity-90 mb-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Latest Score
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">{latestScore}</span>
                  <span className="text-lg opacity-75">/100</span>
                </div>
                {scoreChange !== 0 && (
                  <div className={`flex items-center justify-center gap-1 mt-3 px-3 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                    scoreChange > 0 
                      ? 'bg-green-400/20 text-green-100 border border-green-400/30' 
                      : scoreChange < 0 
                      ? 'bg-red-400/20 text-red-100 border border-red-400/30' 
                      : 'bg-gray-400/20 text-gray-100 border border-gray-400/30'
                  }`}>
                    {scoreChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : scoreChange < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    <span>{scoreChange > 0 ? '+' : ''}{scoreChange}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Toggle Button */}
            <Button
              variant={showSectionScores ? "default" : "outline"}
              size="lg"
              onClick={() => setShowSectionScores(!showSectionScores)}
              data-testid="toggle-section-scores"
              className={showSectionScores 
                ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-xl border-0 px-6 py-3" 
                : "border-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950 px-6 py-3 shadow-lg backdrop-blur-sm"
              }
            >
              {showSectionScores ? (
                <>
                  <TrendingDown className="h-5 w-5 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-gradient-to-br from-white/80 to-blue-50/50 dark:from-gray-900/80 dark:to-gray-800/50 rounded-2xl p-8 shadow-inner border border-white/20 dark:border-gray-700/20 backdrop-blur-sm">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <defs>
                  {/* Enhanced gradients */}
                  <linearGradient id="mainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="30%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="70%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                  
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6"/>
                    <stop offset="50%" stopColor="#8B5CF6"/>
                    <stop offset="100%" stopColor="#6366F1"/>
                  </linearGradient>
                  
                  <linearGradient id="dotGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA"/>
                    <stop offset="50%" stopColor="#3B82F6"/>
                    <stop offset="100%" stopColor="#1D4ED8"/>
                  </linearGradient>
                  
                  <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                  </radialGradient>
                  
                  <linearGradient id="activeGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10B981"/>
                    <stop offset="100%" stopColor="#059669"/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="2 4" 
                  stroke="#E5E7EB" 
                  className="opacity-20" 
                />
                
                <XAxis 
                  dataKey="displayDate"
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  stroke="#9CA3AF"
                  strokeWidth={1}
                />
                
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  label={{ 
                    value: 'Score', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '13px', fontWeight: '500' }
                  }}
                  stroke="#9CA3AF"
                  strokeWidth={1}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference line for target score */}
                <ReferenceLine 
                  y={70} 
                  stroke="#10B981" 
                  strokeDasharray="5 5" 
                  strokeOpacity={0.6}
                  label={{ value: "Target: 70", position: "topRight", fill: "#10B981", fontSize: 12 }}
                />
                
                {/* Main area with gradient fill */}
                <Area
                  type="monotone"
                  dataKey="rmsScore"
                  stroke="url(#strokeGradient)"
                  strokeWidth={4}
                  fill="url(#mainGradient)"
                  dot={<CustomDot />}
                  activeDot={{ 
                    r: 0 // Hide default active dot since we use custom
                  }}
                  name="Overall Score"
                  className="drop-shadow-lg"
                />
                
                {/* Section scores with enhanced styling */}
                {showSectionScores && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="skillsScore"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 6, stroke: "#FFFFFF", className: "drop-shadow-md" }}
                      activeDot={{ r: 9, stroke: "#8B5CF6", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Skills"
                      strokeDasharray="6 3"
                      opacity={0.8}
                    />
                    <Line
                      type="monotone"
                      dataKey="experienceScore"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 6, stroke: "#FFFFFF", className: "drop-shadow-md" }}
                      activeDot={{ r: 9, stroke: "#10B981", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Experience"
                      strokeDasharray="6 3"
                      opacity={0.8}
                    />
                    <Line
                      type="monotone"
                      dataKey="keywordsScore"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: "#F59E0B", strokeWidth: 2, r: 6, stroke: "#FFFFFF", className: "drop-shadow-md" }}
                      activeDot={{ r: 9, stroke: "#F59E0B", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Keywords"
                      strokeDasharray="6 3"
                      opacity={0.8}
                    />
                    <Line
                      type="monotone"
                      dataKey="educationScore"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: "#EF4444", strokeWidth: 2, r: 6, stroke: "#FFFFFF", className: "drop-shadow-md" }}
                      activeDot={{ r: 9, stroke: "#EF4444", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Education"
                      strokeDasharray="6 3"
                      opacity={0.8}
                    />
                    <Line
                      type="monotone"
                      dataKey="certificationsScore"
                      stroke="#06B6D4"
                      strokeWidth={3}
                      dot={{ fill: "#06B6D4", strokeWidth: 2, r: 6, stroke: "#FFFFFF", className: "drop-shadow-md" }}
                      activeDot={{ r: 9, stroke: "#06B6D4", strokeWidth: 3, fill: "#FFFFFF" }}
                      name="Certifications"
                      strokeDasharray="6 3"
                      opacity={0.8}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {chartData.length > 1 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50/80 to-indigo-100/80 dark:from-blue-950/30 dark:to-indigo-950/50 rounded-full px-6 py-3 border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm shadow-lg">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-semibold">
                  Tracking progress across {chartData.length} resume versions
                </span>
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
