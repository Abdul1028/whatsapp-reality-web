"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, ExternalLink, ImageOff, MessageSquareText, Users, CalendarDays, TextSelect, ChevronDown, ChevronRight, LineChart as LineChartIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { 
    UserStat, 
    BasicStats, 
    TimelineActivityData, 
    WordUsageData, 
    EmojiData as EngineEmojiData, 
    TimePatternsData as EngineTimePatternsData,
    UserReplyTimeStat,
    MessageTypeCounts, // <-- add` import
    SharedLink,
    UserMessageTypeBreakdown
} from '@/lib/analysis-engine';
import { cn } from '@/lib/utils';
import { type ChartConfig } from "@/components/ui/chart";
import useMediaQuery from "@/hooks/useMediaQuery";
import { hasViewportRelativeCoordinates } from "@dnd-kit/utilities"
import { createServerParamsForServerSegment } from "next/dist/server/app-render/entry-base"

// Color array for charts
const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

// Interfaces from upload-form.tsx or page.tsx for props
interface WordCountFromProps {
  word: string;
  count: number;
}

interface UserSentiment {
  [user: string]: [string, string];
}
interface SentimentData {
  sentiments: UserSentiment;
  most_positive: string;
  most_negative: string;
}

interface ConversationStat {
  conversation_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  message_count: number;
  participants: number;
  message_density: number;
}
interface UserCount {
  user: string;
  count: number;
}
interface ConversationFlowData {
  total_conversations: number;
  conversation_stats: ConversationStat[];
  conversation_starters: UserCount[];
  conversation_enders: UserCount[];
}

// Definition for UserComparisonTimelineData (as used by UserComparisonTimelineCard)
interface UserTimelineDataPoint {
  time_unit: string;
  user_messages: Record<string, number>;
}
interface UserComparisonTimelineData {
  weekly: UserTimelineDataPoint[];
  monthly: UserTimelineDataPoint[];
  yearly: UserTimelineDataPoint[];
}

interface DashboardChartsProps {
  basicStats: BasicStats;
  userActivity?: UserStat[];
  sentimentData: SentimentData;
  emojiData?: EngineEmojiData;
  conversationPatterns?: any[];
  responseTimes?: any[];
  wordUsage?: WordCountFromProps[];
  messageLength?: any[];
  moodShifts?: any[];
  timePatternsData?: EngineTimePatternsData;
  replyTimeStats?: UserReplyTimeStat[];
  conversationFlowData?: ConversationFlowData;
  timelineActivityData?: TimelineActivityData;
  userComparisonTimelineData?: UserComparisonTimelineData;
  messageTypeCounts?: MessageTypeCounts;
  sharedLinks?: { links: SharedLink[] };
  userMessageTypeBreakdown?: any[];
}

const USERS_PER_PAGE = 10;
const WORDS_PER_PAGE = 15;
const TIMELINE_WEEKS_PER_PAGE = 12; // Weeks per page for Message Activity Timeline
const TIMELINE_MONTHS_PER_PAGE = 12; // Months per page for Message Activity Timeline

function formatSecondsToTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds < 0) return "N/A";
  if (totalSeconds === 0) return "< 1 sec";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let timeString = "";
  if (hours > 0) timeString += `${hours}h `;
  if (minutes > 0) timeString += `${minutes}m `;
  if (seconds > 0 || (hours === 0 && minutes === 0)) timeString += `${seconds}s`;
  
  return timeString.trim() || "0s";
}

const ChartToolbar = ({ title, data, description, onRefresh }: { title: string; data?: any; description?: string; onRefresh?: () => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
    <div className="space-y-1">
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </div>
    <div className="flex items-center gap-1">
      {onRefresh && (
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="sr-only">Refresh</span>
        </Button>
      )}
      {data && (
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => {
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data.json`;
            link.click();
          }}>
          <Download className="h-3.5 w-3.5" />
          <span className="sr-only">Download</span>
        </Button>
      )}
    </div>
  </div>
);

function UserComparisonTimelineCard({
  userComparisonTimelineData,
  allUsers,
  chartColors,
}: {
  userComparisonTimelineData?: UserComparisonTimelineData;
  allUsers: string[];
  chartColors: string[];
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [timeGranularity, setTimeGranularity] = React.useState<"weekly" | "monthly" | "yearly">("monthly");
  const [selectedUser1, setSelectedUser1] = React.useState<string | null>(null);
  const [selectedUser2, setSelectedUser2] = React.useState<string | null>(null);

  const WEEKS_PER_PAGE = 12;
  const [currentWeeklyPage, setCurrentWeeklyPage] = React.useState(0);
  const MONTHS_PER_PAGE = 12;
  const [currentMonthlyPage, setCurrentMonthlyPage] = React.useState(0);

  // Effect to initialize/reset user selections and current pages for weekly/monthly
  React.useEffect(() => {
    if (allUsers.length > 0 && !selectedUser1) {
      setSelectedUser1(allUsers[0]);
    }
    if (allUsers.length > 1 && !selectedUser2) {
      setSelectedUser2(allUsers[1]);
    } else if (allUsers.length <= 1 && selectedUser2) {
      setSelectedUser2(null);
    }

    // Initialize or reset weekly page to show the last page
    if (userComparisonTimelineData?.weekly && userComparisonTimelineData.weekly.length > 0) {
      const totalWeeklyDataPoints = userComparisonTimelineData.weekly.length;
      const totalWeeklyPages = Math.ceil(totalWeeklyDataPoints / WEEKS_PER_PAGE);
      setCurrentWeeklyPage(Math.max(0, totalWeeklyPages - 1));
    } else {
      setCurrentWeeklyPage(0); 
    }

    // Initialize or reset monthly page to show the last page
    if (userComparisonTimelineData?.monthly && userComparisonTimelineData.monthly.length > 0) {
      const totalMonthlyDataPoints = userComparisonTimelineData.monthly.length;
      const totalMonthlyPages = Math.ceil(totalMonthlyDataPoints / MONTHS_PER_PAGE);
      setCurrentMonthlyPage(Math.max(0, totalMonthlyPages - 1));
    } else {
      setCurrentMonthlyPage(0);
    }
  }, [allUsers, selectedUser1, userComparisonTimelineData?.weekly, userComparisonTimelineData?.monthly]);

  // Effect to reset current pages if granularity changes or selected users change while on that granularity
  React.useEffect(() => {
    if (timeGranularity === "weekly") {
      if (userComparisonTimelineData?.weekly && userComparisonTimelineData.weekly.length > 0) {
        const totalWeeklyDataPoints = userComparisonTimelineData.weekly.length;
        const totalWeeklyPages = Math.ceil(totalWeeklyDataPoints / WEEKS_PER_PAGE);
        setCurrentWeeklyPage(Math.max(0, totalWeeklyPages - 1));
      } else {
        setCurrentWeeklyPage(0);
      }
    } else if (timeGranularity === "monthly") {
      if (userComparisonTimelineData?.monthly && userComparisonTimelineData.monthly.length > 0) {
        const totalMonthlyDataPoints = userComparisonTimelineData.monthly.length;
        const totalMonthlyPages = Math.ceil(totalMonthlyDataPoints / MONTHS_PER_PAGE);
        setCurrentMonthlyPage(Math.max(0, totalMonthlyPages - 1));
      } else {
        setCurrentMonthlyPage(0);
      }
    }
  }, [timeGranularity, selectedUser1, selectedUser2, userComparisonTimelineData?.weekly, userComparisonTimelineData?.monthly]);

  const handleUser1Change = (value: string) => {
    if (value === selectedUser2) { 
      const oldUser1 = selectedUser1;
      setSelectedUser1(value);
      setSelectedUser2(oldUser1); 
    } else {
      setSelectedUser1(value);
    }
  };

  const handleUser2Change = (value: string) => {
    if (value === selectedUser1) { 
      const oldUser2 = selectedUser2;
      setSelectedUser2(value);
      setSelectedUser1(oldUser2);
    } else {
      setSelectedUser2(value);
    }
  };
  
  const availableUsersForUser1 = allUsers.filter(u => u !== selectedUser2);
  const availableUsersForUser2 = allUsers.filter(u => u !== selectedUser1);

  if (allUsers.length === 0) {
    return (
      <Card className="col-span-1 md:col-span-3">
        <CardHeader><ChartToolbar title="User Activity Comparison" description="No users available in this chat." /></CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[350px] text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg text-muted-foreground">No user data to display comparison.</p>
        </CardContent>
      </Card>
    );
  }

  const noDataForAllGranularities = !userComparisonTimelineData ||
    (userComparisonTimelineData.weekly.length === 0 &&
     userComparisonTimelineData.monthly.length === 0 &&
     userComparisonTimelineData.yearly.length === 0);

  if (noDataForAllGranularities) {
    return (
        <Card className="col-span-1 md:col-span-3">
            <CardHeader>
                 <ChartToolbar title="User Activity Comparison" description="Not enough data to display comparison chart." />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[350px] text-center">
                <LineChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Data for user comparison timeline is not available.</p>
                <p className="text-sm text-muted-foreground mt-1">Please ensure the chat analysis provides this information.</p>
            </CardContent>
        </Card>
    );
  }

  const totalWeeklyDataPoints = userComparisonTimelineData?.weekly?.length || 0;
  const totalWeeklyPages = Math.ceil(totalWeeklyDataPoints / WEEKS_PER_PAGE);

  const totalMonthlyDataPoints = userComparisonTimelineData?.monthly?.length || 0;
  const totalMonthlyPages = Math.ceil(totalMonthlyDataPoints / MONTHS_PER_PAGE);

  const chartDisplayData = React.useMemo(() => {
    if (!userComparisonTimelineData || !selectedUser1) {
      return [];
    }
    
    let dataForGranularity = userComparisonTimelineData[timeGranularity] || [];

    if (timeGranularity === "weekly") {
      if (dataForGranularity.length > 0) {
        const startIndex = currentWeeklyPage * WEEKS_PER_PAGE;
        const endIndex = startIndex + WEEKS_PER_PAGE;
        dataForGranularity = dataForGranularity.slice(startIndex, endIndex);
      } else {
        dataForGranularity = [];
      }
    } else if (timeGranularity === "monthly") {
      if (dataForGranularity.length > 0) {
        const startIndex = currentMonthlyPage * MONTHS_PER_PAGE;
        const endIndex = startIndex + MONTHS_PER_PAGE;
        dataForGranularity = dataForGranularity.slice(startIndex, endIndex);
      } else {
        dataForGranularity = [];
      }
    }

    if (dataForGranularity.length === 0) return [];

    return dataForGranularity.map(point => {
      const dataPoint: any = { time_unit: point.time_unit };
      if (point.user_messages) {
        dataPoint[selectedUser1] = point.user_messages[selectedUser1] || 0;
        if (selectedUser2) {
          dataPoint[selectedUser2] = point.user_messages[selectedUser2] || 0;
        }
      } else {
        dataPoint[selectedUser1] = 0;
        if (selectedUser2) {
          dataPoint[selectedUser2] = 0;
        }
      }
      return dataPoint;
    });
  }, [userComparisonTimelineData, timeGranularity, selectedUser1, selectedUser2, currentWeeklyPage, currentMonthlyPage]);

  const dynamicChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    if (selectedUser1) {
      config[selectedUser1] = { label: selectedUser1, color: chartColors[0] || "var(--primary)" };
    }
    if (selectedUser2) {
      config[selectedUser2] = { label: selectedUser2, color: chartColors[1] || "var(--chart-2)" };
    }
    return config;
  }, [selectedUser1, selectedUser2, chartColors]);
  
  const formatTimeUnitTick = (timeUnit: string): string => {
    try {
      if (timeGranularity === "yearly") return timeUnit; 
      if (timeGranularity === "monthly") { 
        const [year, month] = timeUnit.split('-');
        return new Date(Number(year), Number(month) - 1).toLocaleDateString('default', { month: 'short', year: '2-digit' });
      }
      if (timeGranularity === "weekly") { 
         const parts = timeUnit.split(/-W|-/);
         return `W${parts[1]} '${parts[0].slice(2)}`;
      }
    } catch (e) { console.warn("Error formatting time unit tick:", e); }
    return timeUnit;
  };

  const formatTooltipLabel = (label: string): string => {
     try {
        if (timeGranularity === "yearly") return `Year: ${label}`;
        if (timeGranularity === "monthly") {
          const [year, month] = label.split('-');
          return `Month: ${new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        }
        if (timeGranularity === "weekly") {
           const parts = label.split(/-W|-/);
           return `Week ${parts[1]}, ${parts[0]}`;
        }
     } catch(e) { console.warn("Error formatting tooltip label:", e); }
     return label;
  };
  
  const hasActualPointsToPlot = chartDisplayData.length > 0 && (selectedUser1 || selectedUser2);

  let toolbarDesc = "User Activity Comparison";
  if (selectedUser1 && selectedUser2) {
    toolbarDesc = `Comparing: ${selectedUser1} vs ${selectedUser2}`;
  } else if (selectedUser1) {
    toolbarDesc = `Activity for ${selectedUser1}`;
  } else if (allUsers.length > 1) {
    toolbarDesc = "Select users to compare activity.";
  }

  return (
    <Card className="col-span-1 md:col-span-3">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <ChartToolbar 
            title="User Activity Comparison" 
            data={hasActualPointsToPlot ? chartDisplayData : undefined} 
            description={toolbarDesc}
            onRefresh={() => { /* Add refresh logic if needed */ }}
          />
          <Tabs value={timeGranularity} onValueChange={(value) => setTimeGranularity(value as any)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex h-9">
              <TabsTrigger value="weekly" className="text-xs px-2 sm:px-3">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2 sm:px-3">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs px-2 sm:px-3">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {allUsers.length > 1 && (selectedUser1 || selectedUser2) && ( 
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedUser1 && allUsers.length > 1 && (
              <Select value={selectedUser1} onValueChange={handleUser1Change}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select User 1" /></SelectTrigger>
                <SelectContent>{allUsers.filter(u => u !== selectedUser2).map(user => (<SelectItem key={`user1-${user}`} value={user}>{user}</SelectItem>))}</SelectContent>
              </Select>
            )}
            {selectedUser1 && allUsers.filter(u => u !== selectedUser1).length > 0 && (
             <Select value={selectedUser2 ?? undefined} onValueChange={handleUser2Change} disabled={!selectedUser1}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select User 2 (Optional)" /></SelectTrigger>
                <SelectContent>{allUsers.filter(u => u !== selectedUser1).map(user => (<SelectItem key={`user2-${user}`} value={user}>{user}</SelectItem>))}</SelectContent>
              </Select>
            )}
          </div>
        )}
        {/* Weekly Pagination Controls */} 
        {timeGranularity === "weekly" && totalWeeklyPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentWeeklyPage(prev => Math.max(0, prev - 1))}
              disabled={currentWeeklyPage === 0}
            >
              Previous Weeks
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentWeeklyPage + 1} of {totalWeeklyPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentWeeklyPage(prev => Math.min(totalWeeklyPages - 1, prev + 1))}
              disabled={currentWeeklyPage >= totalWeeklyPages - 1}
            >
              Next Weeks
            </Button>
          </div>
        )}
        {/* Monthly Pagination Controls */} 
        {timeGranularity === "monthly" && totalMonthlyPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentMonthlyPage(prev => Math.max(0, prev - 1))}
              disabled={currentMonthlyPage === 0}
            >
              Previous Months
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentMonthlyPage + 1} of {totalMonthlyPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentMonthlyPage(prev => Math.min(totalMonthlyPages - 1, prev + 1))}
              disabled={currentMonthlyPage >= totalMonthlyPages - 1}
            >
              Next Months
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {hasActualPointsToPlot ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%"   >
              <AreaChart data={chartDisplayData} margin={{ top: 5, right: 20, bottom: (selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? 70 : 20, left: 5 }}>
                <defs>
                  {selectedUser1 && (
                    <linearGradient id={`fillUser1-${selectedUser1.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dynamicChartConfig[selectedUser1]?.color || 'var(--primary)'} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={dynamicChartConfig[selectedUser1]?.color || 'var(--primary)'} stopOpacity={0.1} />
                    </linearGradient>
                  )}
                  {selectedUser2 && (
                    <linearGradient id={`fillUser2-${selectedUser2.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dynamicChartConfig[selectedUser2]?.color || 'var(--chart-2)'} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={dynamicChartConfig[selectedUser2]?.color || 'var(--chart-2)'} stopOpacity={0.1} />
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="time_unit" 
                  tickFormatter={formatTimeUnitTick}
                  angle={isMobile ? -60 : ((selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? -45 : 0)}
                  textAnchor={isMobile ? "end" : ((selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? "end" : "middle")}
                  height={isMobile ? 80 : ((selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? 70 : 30)}
                  interval={isMobile && (timeGranularity === "monthly" || timeGranularity === "weekly") ? 0 : 'preserveStartEnd'} 
                  minTickGap={isMobile ? 5 : 20} 
                  tick={{ fontSize: isMobile ? '10px' : '12px' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? '10px' : '12px' }} />
                <Tooltip 
                  labelFormatter={formatTooltipLabel} 
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                />
                {selectedUser1 && (
                  <Area type="monotone" dataKey={selectedUser1} stroke={dynamicChartConfig[selectedUser1]?.color || 'var(--primary)'}
                    fill={`url(#fillUser1-${selectedUser1.replace(/\s+/g, '-')})`} stackId={selectedUser2 ? undefined : "a"} strokeWidth={2}
                    name={selectedUser1} connectNulls={true} />
                )}
                {selectedUser2 && (
                  <Area type="monotone" dataKey={selectedUser2} stroke={dynamicChartConfig[selectedUser2]?.color || 'var(--chart-2)'}
                    fill={`url(#fillUser2-${selectedUser2.replace(/\s+/g, '-')})`} stackId={undefined} strokeWidth={2}
                    name={selectedUser2} connectNulls={true} />
                )}
                {(selectedUser1 || selectedUser2) && <Legend wrapperStyle={{ fontSize: '12px', paddingTop: (selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? '20px' : '5px' }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] w-full flex flex-col items-center justify-center text-center">
            <LineChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No activity data to display for current selections.</p>
            <p className="text-sm text-muted-foreground mt-1">Try different users, or adjust the time granularity.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({
  basicStats,
  userActivity,
  sentimentData,
  emojiData,
  conversationPatterns,
  responseTimes,
  wordUsage,
  messageLength,
  moodShifts,
  timePatternsData,
  replyTimeStats,
  conversationFlowData,
  timelineActivityData,
  userComparisonTimelineData,
  messageTypeCounts,
  sharedLinks,
  userMessageTypeBreakdown,
}: DashboardChartsProps) {
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // State and Ref Hooks first
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isFirstMsgOpen, setIsFirstMsgOpen] = React.useState(false);
  const [isLastMsgOpen, setIsLastMsgOpen] = React.useState(false);
  const [timelineGranularityReact, setTimelineGranularityReact] = React.useState<"weekly" | "monthly" | "yearly">("monthly");
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeEmojiIndex, setActiveEmojiIndex] = React.useState<number | null>(null);
  const [currentUserPage, setCurrentUserPage] = React.useState(0);
  const [currentReplyPage, setCurrentReplyPage] = React.useState(0);
  const [currentWordPage, setCurrentWordPage] = React.useState(0);
  const [currentTimelineWeeklyPage, setCurrentTimelineWeeklyPage] = React.useState(0);
  const [currentTimelineMonthlyPage, setCurrentTimelineMonthlyPage] = React.useState(0);
  // Add state for User Feature Usage pagination
  const [currentUserFeaturePage, setCurrentUserFeaturePage] = React.useState(0);

  // Derived data & console logs that depend on props
  const allUserNames = React.useMemo(() => {
    if (!userActivity) {
      console.warn("[DashboardCharts] userActivity prop is undefined or null, cannot derive allUserNames.");
      return [];
    }
    return userActivity.map(ua => ua.user);
  }, [userActivity]);

  // Console logs for debugging prop flow
  console.log("[DashboardCharts] Received userActivity prop (for allUserNames):", userActivity);
  console.log("[DashboardCharts] Derived allUserNames:", allUserNames);
  console.log("[DashboardCharts] Received userComparisonTimelineData prop:", userComparisonTimelineData);
  console.log("[DashboardCharts] Passing to UserComparisonTimelineCard:", { userComparisonTimelineData, allUsers: allUserNames });

  // Memoized calculations and handlers specific to DashboardCharts
  const userSentimentChartData = React.useMemo(() => {
    if (!sentimentData || !sentimentData.sentiments) return [];
    return Object.entries(sentimentData.sentiments).map(([user, values]: [string, [string, string]]) => ({
      user,
      positive: parseFloat(values[0]),
      negative: parseFloat(values[1]),
    }));
  }, [sentimentData]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString; 
    }
  };

  const sortedUserActivity = React.useMemo(() => {
    if (!userActivity) return [];
    return [...userActivity].sort((a, b) => b.message_count - a.message_count);
  }, [userActivity]);

  const totalUserPages = React.useMemo(() => {
    if (!sortedUserActivity || sortedUserActivity.length === 0) return 0;
    return Math.ceil(sortedUserActivity.length / USERS_PER_PAGE);
  }, [sortedUserActivity]);

  const visibleUserActivity = React.useMemo(() => {
    const startIndex = currentUserPage * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return sortedUserActivity.slice(startIndex, endIndex);
  }, [sortedUserActivity, currentUserPage]);

  const handleNextUsersPage = () => {
    if (sortedUserActivity && (currentUserPage + 1) * USERS_PER_PAGE < sortedUserActivity.length) {
      setCurrentUserPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousUsersPage = () => {
    setCurrentUserPage(prevPage => Math.max(0, prevPage - 1));
  };

  const userChartConfig = {
    messages: { label: "Messages", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const topEmojis = React.useMemo(() => {
    if (!emojiData || !emojiData.emoji_usage) return [];
    return emojiData.emoji_usage.slice(0, 8);
  }, [emojiData]);

  const wordUsageChartConfig = {
    count: { label: "Frequency", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const wordUsageChartData = React.useMemo(() => {
    if (!wordUsage || wordUsage.length === 0) return [];
    const startIndex = currentWordPage * WORDS_PER_PAGE;
    const endIndex = startIndex + WORDS_PER_PAGE;
    return wordUsage.slice(startIndex, endIndex);
  }, [wordUsage, currentWordPage]);

  const handleNextWords = () => {
    if (wordUsage && (currentWordPage + 1) * WORDS_PER_PAGE < wordUsage.length) {
      setCurrentWordPage(prevPage => prevPage + 1);
    }
  };


     
  {
    console.log("sharedLinks",sharedLinks)
  }
    
  {
    console.log("userMessageTypeBreakdown",userMessageTypeBreakdown)
    console.log("wordUsage",wordUsage)
    console.log("emojiData",emojiData)
  }



    
    

  

  const handlePreviousWords = () => {
    setCurrentWordPage(prevPage => Math.max(0, prevPage - 1));
  };

  const totalReplyPages = React.useMemo(() => {
    if (!replyTimeStats || replyTimeStats.length === 0) return 0;
    return Math.ceil(replyTimeStats.length / USERS_PER_PAGE);
  }, [replyTimeStats]);

  const visibleReplyTimeStats = React.useMemo(() => {
    if (!replyTimeStats) return [];
    const startIndex = currentReplyPage * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    return replyTimeStats.slice(startIndex, endIndex);
  }, [replyTimeStats, currentReplyPage]);

  const handleNextReplyPage = () => {
    if (replyTimeStats && (currentReplyPage + 1) * USERS_PER_PAGE < replyTimeStats.length) {
      setCurrentReplyPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousReplyPage = () => {
    setCurrentReplyPage(prevPage => Math.max(0, prevPage - 1));
  };

  const fastestReplier = React.useMemo(() => {
    if (!replyTimeStats || replyTimeStats.length === 0) return null;
    return replyTimeStats[0]; 
  }, [replyTimeStats]);

  const slowestReplier = React.useMemo(() => {
    if (!replyTimeStats || replyTimeStats.length === 0) return null;
    const sortedSlowest = [...replyTimeStats].sort((a, b) => (b.average_reply_time_seconds ?? -Infinity) - (a.average_reply_time_seconds ?? -Infinity));
    return sortedSlowest[0];
  }, [replyTimeStats]);

  const replyTimeChartConfig = {
    time: { label: "Avg. Reply Time (sec)", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;



// User Feature Usage pagination logic
const totalUserFeaturePages = React.useMemo(() => {
  if (!userMessageTypeBreakdown || userMessageTypeBreakdown.length === 0) return 0;
  return Math.ceil(userMessageTypeBreakdown.length / USERS_PER_PAGE);
}, [userMessageTypeBreakdown]);

const visibleUserFeatureBreakdown = React.useMemo(() => {
  if (!userMessageTypeBreakdown) return [];
  const startIndex = currentUserFeaturePage * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  return userMessageTypeBreakdown.slice(startIndex, endIndex);
}, [userMessageTypeBreakdown, currentUserFeaturePage]);

const handleNextUserFeaturePage = () => {
  if (userMessageTypeBreakdown && (currentUserFeaturePage + 1) * USERS_PER_PAGE < userMessageTypeBreakdown.length) {
    setCurrentUserFeaturePage(prevPage => prevPage + 1);
  }
};
const handlePreviousUserFeaturePage = () => {
  setCurrentUserFeaturePage(prevPage => Math.max(0, prevPage - 1));
};

  // --- Message Activity Timeline: Pagination & Data Slicing --- 
  // Use the extended type for internal logic.
  // TODO: Update the actual TimelineActivityData type in analysis-engine.
  const currentTimelineData = timelineActivityData; // Use directly

  React.useEffect(() => {
    // Access weekly directly, ensure timelineActivityData itself might be undefined if no data
    if (currentTimelineData?.weekly && currentTimelineData.weekly.length > 0) {
      const totalPages = Math.ceil(currentTimelineData.weekly.length / TIMELINE_WEEKS_PER_PAGE);
      setCurrentTimelineWeeklyPage(Math.max(0, totalPages - 1));
    }
    if (currentTimelineData?.monthly && currentTimelineData.monthly.length > 0) {
      const totalPages = Math.ceil(currentTimelineData.monthly.length / TIMELINE_MONTHS_PER_PAGE);
      setCurrentTimelineMonthlyPage(Math.max(0, totalPages - 1));
    }
  }, [currentTimelineData]); 

  React.useEffect(() => {
    if (timelineGranularityReact === "weekly" && currentTimelineData?.weekly && currentTimelineData.weekly.length > 0) {
      const totalPages = Math.ceil(currentTimelineData.weekly.length / TIMELINE_WEEKS_PER_PAGE);
      setCurrentTimelineWeeklyPage(prev => Math.min(prev, Math.max(0, totalPages - 1))); 
    } else if (timelineGranularityReact === "monthly" && currentTimelineData?.monthly && currentTimelineData.monthly.length > 0) {
      const totalPages = Math.ceil(currentTimelineData.monthly.length / TIMELINE_MONTHS_PER_PAGE);
      setCurrentTimelineMonthlyPage(prev => Math.min(prev, Math.max(0, totalPages - 1)));
    }
  }, [timelineGranularityReact, currentTimelineData]);

  const timelineChartDisplayData = React.useMemo(() => {
    if (!currentTimelineData) return []; // Guard against undefined timelineActivityData
    
    let dataForGranularity: { time_unit: string; message_count: number }[] = [];

    if (timelineGranularityReact === "weekly") {
      dataForGranularity = currentTimelineData.weekly || []; // weekly should exist, but guard with || []
      if (dataForGranularity.length > 0) {
        const startIndex = currentTimelineWeeklyPage * TIMELINE_WEEKS_PER_PAGE;
        const endIndex = startIndex + TIMELINE_WEEKS_PER_PAGE;
        return dataForGranularity.slice(startIndex, endIndex);
      }
    } else if (timelineGranularityReact === "monthly") {
      dataForGranularity = currentTimelineData.monthly || []; // monthly should exist
      if (dataForGranularity.length > 0) {
        const startIndex = currentTimelineMonthlyPage * TIMELINE_MONTHS_PER_PAGE;
        const endIndex = startIndex + TIMELINE_MONTHS_PER_PAGE;
        return dataForGranularity.slice(startIndex, endIndex);
      }
    } else if (timelineGranularityReact === "yearly") {
      return currentTimelineData.yearly || []; // yearly should exist
    }
    return dataForGranularity; // Return sliced data or empty array from weekly/monthly default
  }, [currentTimelineData, timelineGranularityReact, currentTimelineWeeklyPage, currentTimelineMonthlyPage]);

  const totalTimelineWeeklyPages = Math.ceil((currentTimelineData?.weekly?.length || 0) / TIMELINE_WEEKS_PER_PAGE);
  const totalTimelineMonthlyPages = Math.ceil((currentTimelineData?.monthly?.length || 0) / TIMELINE_MONTHS_PER_PAGE);
  // --- End Message Activity Timeline Pagination --- 


      {/* VVVVVV ADD THESE LOGS HERE VVVVVV */}
      console.log("--- DEBUG: About to render Message Activity Timeline ---");
      console.log("timelineActivityData for Message Timeline:", timelineActivityData);
      console.log("timelineGranularityReact for Message Timeline:", timelineGranularityReact);
      console.log("timelineChartDisplayData for Message Timeline:", timelineChartDisplayData);
      {/* ^^^^^^ ADD THESE LOGS HERE ^^^^^^ */}

  const overallLongestStreak = React.useMemo(() => {
    if (!userActivity || userActivity.length === 0) {
      return null;
    }
    let longestStreakHolder: UserStat | null = null;
    for (const stat of userActivity) {
      if (stat.longest_daily_streak && stat.longest_daily_streak.length_days > 0) {
        if (!longestStreakHolder || 
            (longestStreakHolder.longest_daily_streak && stat.longest_daily_streak.length_days > longestStreakHolder.longest_daily_streak.length_days)) {
          longestStreakHolder = stat;
        }
      }
    }
    return longestStreakHolder;
  }, [userActivity]);


  //TODO: get this fixed
  const averageConversationStats = React.useMemo(() => {
    if (!conversationFlowData || !conversationFlowData.conversation_stats || conversationFlowData.conversation_stats.length === 0) {
      return null;
    }
    const totalConversations = conversationFlowData.conversation_stats.length;
    const totalDurationMinutes = conversationFlowData.conversation_stats.reduce((sum, stat) => sum + stat.duration, 0);
    const totalMessages = conversationFlowData.conversation_stats.reduce((sum, stat) => sum + stat.message_count, 0);

    return {
      avgDurationMinutes: totalDurationMinutes / totalConversations,
      avgMessages: totalMessages / totalConversations,
      totalConversations: totalConversations
    };
  }, [conversationFlowData]);

  {
    console.log("averageConversationStats", averageConversationStats)
  }

  // JSX rendering starts here
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {/* Basic Statistics Card */}
      {basicStats && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <ChartToolbar title="Basic Chat Statistics" data={basicStats} description="Total messages, words, users, links, and media shared." onRefresh={() => setRefreshKey(prev => prev + 1)} />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-10 gap-4 text-sm">
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2"><MessageSquareText className="h-6 w-6 text-primary mb-1" /><p className="font-semibold">{basicStats.total_messages.toLocaleString()}</p><p className="text-muted-foreground text-xs">Total Messages</p></div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2"><TextSelect className="h-6 w-6 text-primary mb-1" /><p className="font-semibold">{basicStats.total_words.toLocaleString()}</p><p className="text-muted-foreground text-xs">Total Words</p></div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2"><Users className="h-6 w-6 text-primary mb-1" /><p className="font-semibold">{basicStats.total_users.toLocaleString()}</p><p className="text-muted-foreground text-xs">Unique Users</p></div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2"><ExternalLink className="h-6 w-6 text-primary mb-1" /><p className="font-semibold">{basicStats.total_links.toLocaleString()}</p><p className="text-muted-foreground text-xs">Links Shared</p></div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2"><ImageOff className="h-6 w-6 text-primary mb-1" /><p className="font-semibold">{basicStats.total_media_omitted.toLocaleString()}</p><p className="text-muted-foreground text-xs">Media Shared</p></div>
            <Collapsible open={isFirstMsgOpen} onOpenChange={setIsFirstMsgOpen} className="flex flex-col items-start p-3 rounded-lg bg-muted/50 sm:col-span-2 md:col-span-5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center"><CalendarDays className="h-5 w-5 text-primary mr-2" /><p className="text-xs text-muted-foreground">First Message: <span className="font-semibold text-foreground">{formatDate(basicStats.first_message_date)}</span>{basicStats.first_message_sender && <span className="italic text-muted-foreground ml-1">by {basicStats.first_message_sender}</span>}</p></div>
                <CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="w-9 p-0">{isFirstMsgOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<span className="sr-only">Toggle</span></Button></CollapsibleTrigger>
              </div>
              <CollapsibleContent className="w-full pt-1 text-xs text-muted-foreground mt-1 overflow-hidden"><p className="break-words whitespace-pre-wrap">{basicStats.first_message_text || 'N/A'}</p></CollapsibleContent>
            </Collapsible>
            <Collapsible open={isLastMsgOpen} onOpenChange={setIsLastMsgOpen} className="flex flex-col items-start p-3 rounded-lg bg-muted/50 sm:col-span-2 md:col-span-5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center"><CalendarDays className="h-5 w-5 text-primary mr-2" /><p className="text-xs text-muted-foreground">Last Message: <span className="font-semibold text-foreground">{formatDate(basicStats.last_message_date)}</span>{basicStats.last_message_sender && <span className="italic text-muted-foreground ml-1">by {basicStats.last_message_sender}</span>}</p></div>
                <CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="w-9 p-0">{isLastMsgOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<span className="sr-only">Toggle</span></Button></CollapsibleTrigger>
              </div>
              <CollapsibleContent className="w-full pt-1 text-xs text-muted-foreground mt-1 overflow-hidden"><p className="break-words whitespace-pre-wrap">{basicStats.last_message_text || 'N/A'}</p></CollapsibleContent>
            </Collapsible>
          </CardContent>
          {overallLongestStreak && overallLongestStreak.longest_daily_streak && overallLongestStreak.longest_daily_streak.length_days > 0 && (
            <CardFooter className="pt-4 pb-3 text-sm text-center flex-col items-center border-t mt-2">
              <p className="leading-tight">
                Leading the charge, <span className="font-semibold text-primary">{overallLongestStreak.user}</span> kept the conversation alive with an impressive
                <span className="font-semibold text-primary"> {overallLongestStreak.longest_daily_streak.length_days} day{overallLongestStreak.longest_daily_streak.length_days === 1 ? '' : 's'}</span> messaging streak!
              </p>
              {overallLongestStreak.longest_daily_streak.length_days > 1 && overallLongestStreak.longest_daily_streak.start_date && overallLongestStreak.longest_daily_streak.end_date && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  (From {formatDate(overallLongestStreak.longest_daily_streak.start_date)} to {formatDate(overallLongestStreak.longest_daily_streak.end_date)})
                </p>

              )}
            </CardFooter>
          )}
        </Card>
      )}

            {/* Message Activity Timeline Chart */}
            {timelineActivityData && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <ChartToolbar title="Message Activity Timeline" data={timelineChartDisplayData} onRefresh={() => setRefreshKey(prev => prev + 1)} />
              <Tabs value={timelineGranularityReact} onValueChange={(value) => setTimelineGranularityReact(value as any)} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex h-9">
                  <TabsTrigger value="weekly" className="text-xs px-2 sm:px-3">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-2 sm:px-3">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="text-xs px-2 sm:px-3">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {/* Weekly Pagination for Timeline */}
            {timelineGranularityReact === "weekly" && totalTimelineWeeklyPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentTimelineWeeklyPage(prev => Math.max(0, prev - 1))} disabled={currentTimelineWeeklyPage === 0}>Previous Weeks</Button>
                <span className="text-sm text-muted-foreground">Page {currentTimelineWeeklyPage + 1} of {totalTimelineWeeklyPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentTimelineWeeklyPage(prev => Math.min(totalTimelineWeeklyPages - 1, prev + 1))} disabled={currentTimelineWeeklyPage >= totalTimelineWeeklyPages - 1}>Next Weeks</Button>
              </div>

              
            )}
            {/* Monthly Pagination for Timeline */}
            {timelineGranularityReact === "monthly" && totalTimelineMonthlyPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentTimelineMonthlyPage(prev => Math.max(0, prev - 1))} disabled={currentTimelineMonthlyPage === 0}>Previous Months</Button>
                <span className="text-sm text-muted-foreground">Page {currentTimelineMonthlyPage + 1} of {totalTimelineMonthlyPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentTimelineMonthlyPage(prev => Math.min(totalTimelineMonthlyPages - 1, prev + 1))} disabled={currentTimelineMonthlyPage >= totalTimelineMonthlyPages - 1}>Next Months</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
             {timelineChartDisplayData.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineChartDisplayData} margin={{ top: 5, right: isMobile? 10 : 20, bottom: isMobile ? 70 : 50, left: isMobile ? -10 : 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="time_unit" 
                      angle={isMobile ? -60 : -45} 
                      textAnchor="end" 
                      height={isMobile ? 80 : 70} 
                      interval={timelineGranularityReact === 'weekly' ? 5 : 0} // Set interval to 5 for weekly, 0 for others
                      minTickGap={isMobile ? -5 : 0}
                      tick={{ fontSize: isMobile ? '10px' : '11px' }}
                      tickFormatter={(tick) => {
                        if (timelineGranularityReact === 'yearly') return tick;
                        if (timelineGranularityReact === 'monthly') { 
                          const [year, month] = String(tick).split('-'); 
                          try { return new Date(Number(year), Number(month)-1).toLocaleDateString('default', { month: 'short', year: '2-digit' }); } catch (e) { return String(tick); }
                        }
                        if (timelineGranularityReact === 'weekly') { 
                           const parts = String(tick).split(/-W|-/);
                           if (parts.length === 2 && parts[0].length === 4 && parts[1].length >= 1) {
                               return `W${parts[1]} '${parts[0].slice(2)}`;
                           }
                           return String(tick); // Fallback
                        }
                        return String(tick); 
                      }}/>
                    <YAxis tick={{ fontSize: isMobile ? '10px' : '11px' }}/>
                    <Tooltip labelFormatter={(label) => {
                         if (timelineGranularityReact === 'yearly') return `Year: ${String(label)}`;
                         if (timelineGranularityReact === 'monthly') { 
                           const [year, month] = String(label).split('-'); 
                           try { return `Month: ${new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'long', year: 'numeric' })}`; } catch (e) { return String(label); }
                         }
                         if (timelineGranularityReact === 'weekly') { 
                            const parts = String(label).split(/-W|-/);
                            if (parts.length === 2 && parts[0].length === 4 && parts[1].length >= 1) {
                                return `Week ${parts[1]}, ${parts[0]}`;
                            }
                            return String(label); // Fallback
                         }
                         return `Date: ${String(label)}`; 
                      }}
                      formatter={(value: number) => [value.toLocaleString(), "Messages"]}/>
                    <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] w-full flex flex-col items-center justify-center text-center">
                <LineChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No activity data for {timelineGranularityReact} view.</p>
                <p className="text-sm text-muted-foreground mt-1">There might be no messages in this period or for this granularity.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hourly Message Activity Line Chart */}
      {timePatternsData && timePatternsData.hourly_activity && timePatternsData.hourly_activity.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader><ChartToolbar title="Hourly Message Activity" data={timePatternsData.hourly_activity} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timePatternsData.hourly_activity.sort((a, b) => a.hour - b.hour)} margin={{ top: 5, right: 20, left: isMobile ? -10 : 0, bottom: isMobile ? 20 : 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => { const h = parseInt(hour as string, 10); if (h === 0) return "12AM"; if (h === 12) return "12PM"; if (h < 12) return `${h}AM`; return `${h - 12}PM`;}}
                    interval={isMobile ? 3 : 1}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 50 : 30}
                    tick={{ fontSize: isMobile ? '10px' : '12px' }}
                    minTickGap={isMobile ? 0 : 5}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <Tooltip labelFormatter={(label) => { const h = parseInt(label as string, 10); if (h === 0) return "12 AM"; if (h === 12) return "12 PM"; if (h < 12) return `${h} AM`; return `${h - 12} PM`;}}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}/>
                  <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }} />
                  <Line type="monotone" dataKey="message_count" name="Messages" stroke="var(--primary)" strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} activeDot={{ r: isMobile ? 4 : 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

            {/* User Activity Section with Tabs */}
            {userActivity && userActivity.length > 0 && sortedUserActivity.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <Tabs defaultValue="donut" className="w-full">
            <CardHeader className="px-2 sm:px-6 pt-2 sm:pt-4 pb-0">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="donut">Activity Donut</TabsTrigger><TabsTrigger value="bar">Activity Bar Chart</TabsTrigger></TabsList>
            </CardHeader>
            <TabsContent value="donut">
              <Card className="border-none shadow-none">
                <CardHeader><ChartToolbar title="Top 8 User Activity (Messages)" data={sortedUserActivity.slice(0, 8)} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
                <CardContent className="p-0 sm:p-6 flex items-center justify-center">
                  <div className="h-[350px] w-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sortedUserActivity.slice(0, 8)} cx="50%" cy="50%" labelLine={false} outerRadius={120} innerRadius={70} dataKey="message_count" nameKey="user" paddingAngle={2}>
                          {sortedUserActivity.slice(0, 8).map((entry, index) => (<Cell key={`cell-user-donut-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value: number, name: string) => [value.toLocaleString(), `Messages by ${name}`]} />
                        <Legend iconSize={10} formatter={(value) => { const userName = value as string; const userColor = COLORS[sortedUserActivity.findIndex(u => u.user === userName) % COLORS.length] || '#000'; return <span style={{ color: userColor }}>{userName.length > 20 ? userName.slice(0, 18) + '...' : userName}</span>; }} wrapperStyle={{fontSize: '12px'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bar">
              <Card className="border-none shadow-none">
                <CardHeader><ChartToolbar title="Messages per User (Bar)" data={visibleUserActivity} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={visibleUserActivity} margin={{ top: 5, right: 20, bottom: 70, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="user" angle={-45} textAnchor="end" interval={0} height={80}/>
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Messages"]} />
                        <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]}><LabelList dataKey="message_count" position="top" formatter={(value: number) => value.toLocaleString()} /></Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {sortedUserActivity.length > USERS_PER_PAGE && (
                    <div className="mt-4 flex justify-center items-center gap-2">
                      <Button onClick={handlePreviousUsersPage} variant="outline" disabled={currentUserPage === 0}>Previous</Button>
                      <span className="text-sm text-muted-foreground">Page {currentUserPage + 1} of {totalUserPages}</span>
                      <Button onClick={handleNextUsersPage} variant="outline" disabled={(currentUserPage + 1) * USERS_PER_PAGE >= sortedUserActivity.length}>Next</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* UserComparisonTimelineCard */}
      {allUserNames.length > 0 && (
        <UserComparisonTimelineCard 
          userComparisonTimelineData={userComparisonTimelineData} 
          allUsers={allUserNames}
          chartColors={COLORS} 
        />
      )}
      
      {/* Hourly Activity Bar Chart */}
      {timePatternsData && timePatternsData.hourly_activity && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0"><ChartToolbar title="Hourly Activity (All Messages)" data={timePatternsData.hourly_activity} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={timePatternsData.hourly_activity} 
                  margin={isMobile ? { top: 20, right: 10, bottom: 50, left: 5 } : { top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="hour" 
                    name="Hour of Day" 
                    tickFormatter={(hour) => { const h = parseInt(hour as string, 10); if (h === 0) return "12AM"; if (h === 12) return "12PM"; if (h < 12) return `${h}AM`; return `${h - 12}PM`;}}
                    interval={isMobile ? 2 : 0}                    
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 50 : 30}                    
                    tick={{ fontSize: isMobile ? '10px' : '12px' }}
                    minTickGap={isMobile ? 0 : 5}
                  />
                  <YAxis name="Messages" allowDecimals={false} tick={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <Tooltip labelFormatter={(label) => { const h = parseInt(label as string, 10); if (h === 0) return "12 AM"; if (h === 12) return "12 PM"; if (h < 12) return `${h} AM`; return `${h - 12} PM`;}}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}/>
                  <Legend wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }} />
                  <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={isMobile ? 10 : undefined} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

    {/* Render Average Conversation Stats Below Basic Statistics */}
    {averageConversationStats && (
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <ChartToolbar
            title="Average Conversation Length" 
            description="Analysis of conversation durations and message counts."
            data={conversationFlowData?.conversation_stats}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-2xl font-bold text-primary">{averageConversationStats.avgDurationMinutes.toFixed(1)} min</span>
              <span className="text-xs text-muted-foreground">Avg. Conversation Duration</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-2xl font-bold text-primary">{averageConversationStats.avgMessages.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">Avg. Messages per Conversation</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-2xl font-bold text-primary">{averageConversationStats.totalConversations.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">Total Conversations</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {conversationFlowData && conversationFlowData.conversation_stats.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversationFlowData.conversation_stats} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="conversation_id"
                    label={{ value: 'Conversation', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: '11px' }}
                    interval={0}
                    minTickGap={5}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft', offset: 10 }}
                    tick={{ fontSize: '11px' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Messages', angle: 90, position: 'insideRight', offset: 10 }}
                    tick={{ fontSize: '11px' }}
                    allowDecimals={false}
                  />
                  <Tooltip formatter={(value, name) => [value.toLocaleString(), name === 'duration' ? 'Duration (min)' : 'Messages']} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="duration" name="Duration (min)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="message_count" name="Messages" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] w-full flex flex-col items-center justify-center text-center">
              <LineChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No conversation data to display.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )}

      {/* Word Usage and Emoji Usage Tabs */}
      {(wordUsage && wordUsage.length > 0) || (emojiData && emojiData.emoji_usage && emojiData.emoji_usage.length > 0) && (
        <div className="col-span-1 md:col-span-3">
          <Tabs defaultValue={(wordUsage && wordUsage.length > 0) ? "wordUsage" : "emojiUsage"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4"><TabsTrigger value="wordUsage" disabled={!wordUsage || wordUsage.length === 0}>Word Usage</TabsTrigger><TabsTrigger value="emojiUsage" disabled={!emojiData || !emojiData.emoji_usage || emojiData.emoji_usage.length === 0}>Emoji Usage</TabsTrigger></TabsList>
            {wordUsage && wordUsage.length > 0 && (
              <TabsContent value="wordUsage">
                <Card className="border-none shadow-none">
                  <CardHeader className="pb-0"><ChartToolbar title="Most Frequent Words" data={wordUsageChartData} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
                  <CardContent className="p-0 sm:p-6">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wordUsageChartData} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="word" type="category" width={80} />
                          <Tooltip formatter={(value: number) => [value.toLocaleString(), "Frequency"]}/><Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {wordUsage.length > WORDS_PER_PAGE && (
                      <div className="mt-4 flex justify-center items-center gap-2">
                        <Button onClick={handlePreviousWords} variant="outline" disabled={currentWordPage === 0}>Previous</Button>
                        <span className="text-sm text-muted-foreground">Page {currentWordPage + 1} of {Math.ceil(wordUsage.length / WORDS_PER_PAGE)}</span>
                        <Button onClick={handleNextWords} variant="outline" disabled={(currentWordPage + 1) * WORDS_PER_PAGE >= wordUsage.length}>Next</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {emojiData && emojiData.emoji_usage && emojiData.emoji_usage.length > 0 && (
              <TabsContent value="emojiUsage">
                <Card className="border-none shadow-none">
                  <CardHeader className="pb-0"><ChartToolbar title="Top 8 Emoji Usage" data={topEmojis} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
                  <CardContent className="p-0 sm:p-6 flex items-center justify-center">
                    <div className="h-[300px] w-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={topEmojis} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={60} dataKey="count" nameKey="emoji" paddingAngle={2}>
                            {topEmojis.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [value.toLocaleString(), name]} /><Legend iconSize={10} formatter={(value, entry: any) => <span style={{ color: entry.color }}>{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Average Reply Time Chart */}
      {replyTimeStats && replyTimeStats.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <ChartToolbar title="Average User Reply Times" data={replyTimeStats} description="Average reply times for all users." onRefresh={() => setRefreshKey(prev => prev + 1)} />
            <div className="text-sm text-muted-foreground pt-2 space-y-1">
              {fastestReplier && (<p>Fastest Average: <span className="font-semibold text-primary">{fastestReplier.user}</span> ({formatSecondsToTime(fastestReplier.average_reply_time_seconds)})</p>)}
              {slowestReplier && (<p>Slowest Average: <span className="font-semibold text-destructive">{slowestReplier.user}</span> ({formatSecondsToTime(slowestReplier.average_reply_time_seconds)})</p>)}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={visibleReplyTimeStats} 
                  margin={isMobile ? { top: 5, right: 15, bottom: 85, left: visibleReplyTimeStats.length <=3 ? 40 : 15 } : { top: 5, right: 30, bottom: 70, left: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="user" 
                    angle={isMobile ? -60 : -45} 
                    textAnchor="end" 
                    interval={0} 
                    height={isMobile ? 90 : 80} 
                    tickFormatter={(value) => (value as string).slice(0, isMobile? 10 : 12) + ((value as string).length > (isMobile? 10 : 12) ? '...' : '')}
                    tick={{ fontSize: isMobile ? '9px' : '11px' }}
                    minTickGap={isMobile ? -5 : 0}
                  />
                  <YAxis 
                    dataKey="average_reply_time_seconds" 
                    allowDecimals={false} 
                    label={{ value: "Avg. Reply Time", angle: -90, position: 'insideLeft', offset: isMobile ? -5 : -15, style: {fontSize: isMobile ? '0.7rem' : '0.8rem', fill: 'var(--primary)'} }} 
                    tickFormatter={(value) => formatSecondsToTime(value as number)} 
                    tickCount={isMobile ? 5 : 6} 
                    width={isMobile ? 75 : 90}
                    tick={{ fontSize: isMobile ? '9px' : '10px' }}
                  />
                  <Tooltip formatter={(value: number, name: string, props: any) => [formatSecondsToTime(value), `Avg. Reply Time (${props.payload.user})`]} labelFormatter={() => ``}/>
                  <Bar dataKey="average_reply_time_seconds" name="Average Reply Time" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="average_reply_time_seconds" position="top" formatter={(value: number) => formatSecondsToTime(value)} fontSize={isMobile ? 9 : 10}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {replyTimeStats.length > USERS_PER_PAGE && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <Button onClick={handlePreviousReplyPage} variant="outline" disabled={currentReplyPage === 0}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {currentReplyPage + 1} of {totalReplyPages}</span>
                <Button onClick={handleNextReplyPage} variant="outline" disabled={(currentReplyPage + 1) * USERS_PER_PAGE >= replyTimeStats.length}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
            {/* User Feature Usage Stacked Bar Chart */}
            {userMessageTypeBreakdown && userMessageTypeBreakdown.length > 0 && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <ChartToolbar
              title="User Feature Usage"
              description="Messages, Stickers, Media, and Documents sent by each user."
              data={userMessageTypeBreakdown}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visibleUserFeatureBreakdown} margin={{ top: 5, right: 20, bottom: 50, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="user" angle={isMobile ? -30 : -20} textAnchor="end" interval={0} height={isMobile ? 80 : 60} tick={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="messages" stackId="a" fill="#A3B18A" name="Messages" />
                  <Bar dataKey="stickers" stackId="a" fill="#BC6C25" name="Stickers" />
                  <Bar dataKey="media" stackId="a" fill="#468FAF" name="Media" />
                  <Bar dataKey="documents" stackId="a" fill="#F4A259" name="Documents" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {userMessageTypeBreakdown.length > USERS_PER_PAGE && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <Button onClick={handlePreviousUserFeaturePage} variant="outline" size={isMobile ? 'sm' : 'default'} disabled={currentUserFeaturePage === 0}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {currentUserFeaturePage + 1} of {totalUserFeaturePages}</span>
                <Button onClick={handleNextUserFeaturePage} variant="outline" size={isMobile ? 'sm' : 'default'} disabled={(currentUserFeaturePage + 1) * USERS_PER_PAGE >= userMessageTypeBreakdown.length}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

         {/* Message Type Distribution */}
         {messageTypeCounts && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <ChartToolbar
              title="Message Type Distribution"
              description="Distribution of different message types (stickers, images, videos, documents, audio, and generic media) shared in the chat."
              data={messageTypeCounts}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[350px] w-full max-w-[400px]">
              <ResponsiveContainer width="100%" height="100%" key={refreshKey}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Sticker', value: messageTypeCounts.sticker },
                      { name: 'Image', value: messageTypeCounts.image },
                      { name: 'Video', value: messageTypeCounts.video },
                      { name: 'Document', value: messageTypeCounts.document },
                      { name: 'Audio', value: messageTypeCounts.audio },
                      { name: 'Media', value: messageTypeCounts.media },
                    ].filter(item => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={2}
                  >
                    {[
                      messageTypeCounts.sticker,
                      messageTypeCounts.image,
                      messageTypeCounts.video,
                      messageTypeCounts.document,
                      messageTypeCounts.audio,
                      messageTypeCounts.media,
                    ].map((_, index) => (
                      <Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} messages`, name]} />
                  <Legend iconSize={12} formatter={(value, entry) => {
                    const color = COLORS[[
                      'Sticker', 'Image', 'Video', 'Document', 'Audio', 'Media'
                    ].indexOf(value) % COLORS.length];
                    return <span style={{ color }}>{value}</span>;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deep Link Analysis (Shared Links) */}
      {sharedLinks && sharedLinks.links.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <ChartToolbar
              title="Deep Link Analysis"
              description="All links shared in the chat, grouped by domain. Click to preview."
              data={sharedLinks}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          </CardHeader>
          <CardContent>
            {/* Group links by domain */}
            {Object.entries(
              sharedLinks.links.reduce<Record<string, Array<SharedLink>>>((acc: Record<string, Array<SharedLink>>, link: SharedLink) => {
                try {
                  const urlObj = new URL(link.url.startsWith('http') ? link.url : 'https://' + link.url);
                  const domain = urlObj.hostname.replace(/^www\./, '');
                  if (!acc[domain]) acc[domain] = [];
                  acc[domain].push(link);
                } catch {
                  if (!acc['other']) acc['other'] = [];
                  acc['other'].push(link);
                }
                return acc;
              }, {})
            ).sort((a, b) => b[1].length - a[1].length)
            .map(([domain, links]: [string, Array<SharedLink>]) => (
              <Collapsible key={domain}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex justify-between items-center text-left mb-1">
                    <span className="font-semibold">{domain}</span>
                    <span className="text-xs text-muted-foreground">{links.length} link{links.length > 1 ? 's' : ''}</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 border-l border-muted-foreground/20 mb-2">
                  <ul className="space-y-1">
                    {links.map((link, idx) => (
                      <li key={link.url + link.timestamp + idx} className="flex flex-col">
                        <a
                          href={link.url.startsWith('http') ? link.url : 'https://' + link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline break-all hover:text-primary/80"
                        >
                          {link.url}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          Shared by <span className="font-semibold">{link.user}</span>
                          {link.timestamp && (
                            <> on {new Date(link.timestamp).toLocaleString()}</>
                          )}
                        </span>
                        {link.message_text && (
                          <span className="text-xs text-muted-foreground italic">"{link.message_text}"</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Per-User Statistics Section */}
      {userActivity && userActivity.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader><ChartToolbar title="Per-User Statistics" data={userActivity} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userActivity.map((stat) => (
              <Card key={stat.user} className="flex flex-col">
                <CardHeader className="pb-2"><CardTitle className="text-lg">{stat.user}</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1 flex-grow">
                  <p>Messages: <span className="font-semibold">{stat.message_count.toLocaleString()}</span></p>
                  <p>Words: <span className="font-semibold">{stat.word_count.toLocaleString()}</span></p>
                  <p>Avg. Msg Length: <span className="font-semibold">{stat.avg_message_length.toFixed(1)} words</span></p>
                  <p>Links Shared: <span className="font-semibold">{stat.links_shared_count.toLocaleString()}</span></p>
                  <p>Media Shared: <span className="font-semibold">{stat.media_shared_count.toLocaleString()}</span></p>
                  <p>Voice Notes: <span className="font-semibold">{stat.voice_notes_sent?.toLocaleString() || '0'}</span></p>
                  {stat.longest_daily_streak && (
                    <p>Longest Daily Streak: 
                      <span className="font-semibold">
                        {stat.longest_daily_streak.length_days > 0 ? `${stat.longest_daily_streak.length_days} day${stat.longest_daily_streak.length_days === 1 ? '' : 's'}` : 'N/A'}
                      </span>

                    </p>
                  )}
                  {stat.most_used_emojis && stat.most_used_emojis.length > 0 && (
                    <div className="pt-1"><p className="text-xs font-medium">Top Emojis:</p><div className="flex flex-wrap gap-1 text-lg pt-0.5">{stat.most_used_emojis.map(emojiStat => (<span key={emojiStat.emoji} title={`${emojiStat.count} times`}>{emojiStat.emoji}</span>))}</div></div>)}
                  {stat.biggest_message && stat.biggest_message.text && stat.biggest_message.text.length > 0 && (
                    <Collapsible className="pt-1">
                      <CollapsibleTrigger asChild><Button variant="link" className="p-0 h-auto text-xs">Show Biggest Message ({stat.biggest_message.length} words)</Button></CollapsibleTrigger>
                      <CollapsibleContent className="text-xs text-muted-foreground mt-1 p-2 border rounded bg-muted/50 overflow-hidden"><p className="break-words whitespace-pre-wrap">{stat.biggest_message.text}</p></CollapsibleContent>
                    </Collapsible>)}
                </CardContent>
              </Card>))}
          </CardContent>
        </Card>)}
      
      {/* User Sentiment Analysis Chart */}
      {userSentimentChartData.length > 0 && sentimentData && (
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-0">
            <ChartToolbar title="User Sentiment Analysis" data={userSentimentChartData} onRefresh={() => setRefreshKey(prev => prev + 1)} />
            <div className="text-sm text-muted-foreground pt-2">
              <p>Most Positive: <span className="font-semibold text-primary">{sentimentData.most_positive}</span></p>
              <p>Most Negative: <span className="font-semibold text-destructive">{sentimentData.most_negative}</span></p>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userSentimentChartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis dataKey="user" type="category" width={80} />
                  <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name.charAt(0).toUpperCase() + name.slice(1)]} /><Legend />
                  <Bar dataKey="positive" name="Positive" stackId="a" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="negative" name="Negative" stackId="a" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>)}

      {/* Remaining/Unspecified Charts */}
      {responseTimes && responseTimes.length > 0 && (
        <Card className="col-span-1">
          <CardHeader className="pb-0"><ChartToolbar title="Response Times" data={responseTimes} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="p-0 sm:p-6"><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={responseTimes} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="time" /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="var(--primary)" /></LineChart></ResponsiveContainer></div></CardContent>
        </Card>)}

      {messageLength && messageLength.length > 0 && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0"><ChartToolbar title="Message Length Distribution" data={messageLength} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="p-0 sm:p-6"><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={messageLength} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="length" /><YAxis /><Tooltip /><Area type="monotone" dataKey="count" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div></CardContent>
        </Card>)}

      {moodShifts && moodShifts.length > 0 && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0"><ChartToolbar title="Mood Shifts Over Time" data={moodShifts} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="p-0 sm:p-6"><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={moodShifts} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="time" /><YAxis /><Tooltip /><Line type="monotone" dataKey="sentiment" stroke="var(--primary)" /></LineChart></ResponsiveContainer></div></CardContent>
        </Card>)}
        
   


      
    </div>
  );
}



// // Helper function (add this within the file or import if it exists elsewhere)
// // This is a common way to get ISO week number. Add to utils if used in multiple places.
// function getISOWeek(date: Date): number {
//   const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
//   const dayNum = d.getUTCDay() || 7;
//   d.setUTCDate(d.getUTCDate() + 4 - dayNum);
//   const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
//   return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
// }


