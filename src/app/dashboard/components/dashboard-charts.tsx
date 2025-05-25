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
} from '@/lib/analysis-engine';
import { cn } from '@/lib/utils';
import { type ChartConfig } from "@/components/ui/chart";

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
}

const USERS_PER_PAGE = 10;
const WORDS_PER_PAGE = 15;

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
  
  console.log("[UserComparisonTimelineCard] Received props:", {
    userComparisonTimelineData,
    allUsers,
  });

  const [timeGranularity, setTimeGranularity] = React.useState<"weekly" | "monthly" | "yearly">("monthly");
  const [selectedUser1, setSelectedUser1] = React.useState<string | null>(null);
  const [selectedUser2, setSelectedUser2] = React.useState<string | null>(null);

  const WEEKS_PER_PAGE = 8;
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
            <ResponsiveContainer width="100%" height="100%">
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
                <XAxis dataKey="time_unit" tickFormatter={formatTimeUnitTick}
                  angle={(selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? -45 : 0}
                  textAnchor={(selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? "end" : "middle"}
                  height={(selectedUser1 && selectedUser2 && allUsers.length > 2) || (selectedUser1 && allUsers.length > 2 && timeGranularity !== 'yearly') ? 70 : 30}
                  interval={'preserveStartEnd'} minTickGap={20} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={formatTooltipLabel} formatter={(value: number, name: string) => [value.toLocaleString(), name]}/>
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
}: DashboardChartsProps) {
  
  // State and Ref Hooks first
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [isFirstMsgOpen, setIsFirstMsgOpen] = React.useState(false);
  const [isLastMsgOpen, setIsLastMsgOpen] = React.useState(false);
  const [timelineGranularityReact, setTimelineGranularityReact] = React.useState<"daily" | "monthly" | "yearly">("monthly");
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [activeEmojiIndex, setActiveEmojiIndex] = React.useState<number | null>(null);
  const [currentUserPage, setCurrentUserPage] = React.useState(0);
  const [currentReplyPage, setCurrentReplyPage] = React.useState(0);
  const [currentWordPage, setCurrentWordPage] = React.useState(0);

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

      {/* Message Activity Timeline Chart */}
      {timelineActivityData && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <ChartToolbar title="Message Activity Timeline" data={timelineActivityData[timelineGranularityReact as keyof TimelineActivityData]} onRefresh={() => setRefreshKey(prev => prev + 1)} />
              <Tabs value={timelineGranularityReact} onValueChange={(value) => setTimelineGranularityReact(value as any)} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex h-9"><TabsTrigger value="daily">Daily</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger><TabsTrigger value="yearly">Yearly</TabsTrigger></TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineActivityData[timelineGranularityReact as keyof TimelineActivityData]} margin={{ top: 5, right: 20, bottom: 50, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time_unit" angle={-45} textAnchor="end" height={70} interval={Math.max(0, Math.floor((timelineActivityData[timelineGranularityReact as keyof TimelineActivityData]?.length || 0) / 15) -1)}
                    tickFormatter={(tick) => {
                      if (timelineGranularityReact === 'yearly') return tick;
                      if (timelineGranularityReact === 'monthly') { const [year, month] = tick.split('-'); return `${new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'short' })} '${year.slice(2)}`; }
                      return tick;
                    }}/>
                  <YAxis />
                  <Tooltip labelFormatter={(label) => {
                       if (timelineGranularityReact === 'yearly') return `Year: ${label}`;
                       if (timelineGranularityReact === 'monthly') { const [year, month] = label.split('-'); return `Month: ${new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'long', year: 'numeric' })}`; }
                       return `Date: ${label}`;}}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}/>
                  <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                <LineChart data={timePatternsData.hourly_activity.sort((a, b) => a.hour - b.hour)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="hour" tickFormatter={(hour) => { const h = parseInt(hour as string, 10); if (h === 0) return "12 AM"; if (h === 12) return "12 PM"; if (h < 12) return `${h} AM`; return `${h - 12} PM`;}}
                    interval={typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 1}/>
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(label) => { const h = parseInt(label as string, 10); if (h === 0) return "12 AM"; if (h === 12) return "12 PM"; if (h < 12) return `${h} AM`; return `${h - 12} PM`;}}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}/>
                  <Legend />
                  <Line type="monotone" dataKey="message_count" name="Messages" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Hourly Activity Bar Chart */}
      {timePatternsData && timePatternsData.hourly_activity && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0"><ChartToolbar title="Hourly Activity (All Messages)" data={timePatternsData.hourly_activity} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timePatternsData.hourly_activity} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="hour" name="Hour of Day" tickFormatter={(hour) => { const h = parseInt(hour as string, 10); if (h === 0) return "12 AM"; if (h === 12) return "12 PM"; if (h < 12) return `${h} AM`; return `${h - 12} PM`;}}/>
                  <YAxis name="Messages" allowDecimals={false} />
                  <Tooltip labelFormatter={(label) => { const h = parseInt(label as string, 10); if (h === 0) return "12 AM"; if (h === 12) return "12 PM"; if (h < 12) return `${h} AM`; return `${h - 12} PM`;}}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}/>
                  <Legend />
                  <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                <BarChart data={visibleReplyTimeStats} margin={{ top: 5, right: 30, bottom: 70, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="user" angle={-45} textAnchor="end" interval={0} height={80} tickFormatter={(value) => (value as string).slice(0, 12) + ((value as string).length > 12 ? '...' : '')}/>
                  <YAxis dataKey="average_reply_time_seconds" allowDecimals={false} label={{ value: "Avg. Reply Time", angle: -90, position: 'insideLeft', offset: -15, style: {fontSize: '0.8rem', fill: 'var(--primary)'} }} tickFormatter={(value) => formatSecondsToTime(value as number)} tickCount={6} width={90}/>
                  <Tooltip formatter={(value: number, name: string, props: any) => [formatSecondsToTime(value), `Avg. Reply Time (${props.payload.user})`]} labelFormatter={() => ``}/>
                  <Bar dataKey="average_reply_time_seconds" name="Average Reply Time" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="average_reply_time_seconds" position="top" formatter={(value: number) => formatSecondsToTime(value)} fontSize={10}/>
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
      
      {/* UserComparisonTimelineCard */}
      {allUserNames.length > 0 && (
        <UserComparisonTimelineCard 
          userComparisonTimelineData={userComparisonTimelineData} 
          allUsers={allUserNames}
          chartColors={COLORS} 
        />
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

      {conversationFlowData && conversationFlowData.conversation_stats && conversationFlowData.conversation_stats.length > 0 && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0"><ChartToolbar title="Conversation Statistics" data={conversationFlowData.conversation_stats} onRefresh={() => setRefreshKey(prev => prev + 1)} /></CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border"><thead className="bg-muted/50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Time</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">End Time</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration (min)</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Participants</th><th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Msg Density</th></tr></thead>
                <tbody className="bg-background divide-y divide-border">
                  {conversationFlowData.conversation_stats.map((stat) => (<tr key={stat.conversation_id}><td className="px-4 py-2 whitespace-nowrap text-sm">{stat.conversation_id}</td><td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(stat.start_time).toLocaleString()}</td><td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(stat.end_time).toLocaleString()}</td><td className="px-4 py-2 whitespace-nowrap text-sm">{stat.duration.toFixed(2)}</td><td className="px-4 py-2 whitespace-nowrap text-sm">{stat.message_count}</td><td className="px-4 py-2 whitespace-nowrap text-sm">{stat.participants}</td><td className="px-4 py-2 whitespace-nowrap text-sm">{stat.message_density.toFixed(2)}</td></tr>))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>)}
    </div>
  );
}