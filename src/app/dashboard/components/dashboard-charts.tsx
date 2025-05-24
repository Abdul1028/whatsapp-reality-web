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
import { Download, RefreshCw, ExternalLink, ImageOff, MessageSquareText, Users, CalendarDays, TextSelect, ChevronDown, ChevronRight } from "lucide-react"
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
    ActivityPoint,
    TimePatternsData as EngineTimePatternsData,
    UserReplyTimeStat
} from '@/lib/analysis-engine';
import { cn } from '@/lib/utils';
import { PieChart as RechartsPieChart, Sector } from 'recharts';
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
interface WordCount {
  word: string;
  count: number;
}

// Updated SentimentData interface to match new API structure
interface UserSentiment {
  [user: string]: [string, string]; // ["positive_percentage", "negative_percentage"]
}
interface SentimentData {
  sentiments: UserSentiment;
  most_positive: string;
  most_negative: string;
}

interface EmojiUsage {
  emoji: string;
  count: number;
}
interface LocalEmojiData {
  emoji_usage: EmojiUsage[];
}

// Remove or comment out old local TimePatternsData related interfaces
// interface HourlyActivity { ... }
// interface DailyActivity { ... }
// interface MonthlyActivity { ... }
// type UserHourlyActivity = { ... };
// type UserDailyActivity = { ... };
// interface TimePatternsData { ... } // This is now coming from the engine via props

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

interface DashboardChartsProps {
  basicStats: BasicStats;
  userActivity: UserStat[] | undefined;
  sentimentData: SentimentData;
  emojiData: EngineEmojiData | undefined;
  conversationPatterns: any[];
  responseTimes: any[];
  wordUsage: WordCount[] | undefined;
  messageLength: any[];
  moodShifts: any[];
  timePatternsData: EngineTimePatternsData;
  replyTimeStats?: UserReplyTimeStat[];
  conversationFlowData: ConversationFlowData;
  timelineActivityData?: TimelineActivityData;
}

const USERS_PER_PAGE = 10;
const WORDS_PER_PAGE = 15;

// Helper function to format seconds into a readable time string
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
  
  return timeString.trim() || "0s"; // Fallback for very small fractions resulting in empty string
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
}: DashboardChartsProps) {
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [isFirstMsgOpen, setIsFirstMsgOpen] = React.useState(false);
  const [isLastMsgOpen, setIsLastMsgOpen] = React.useState(false);
  const [timelineGranularity, setTimelineGranularity] = React.useState<"daily" | "monthly" | "yearly">("monthly");
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = React.useState<keyof TimelineActivityData>('daily');
  const [activeEmojiIndex, setActiveEmojiIndex] = React.useState<number | null>(null);
  const [currentUserPage, setCurrentUserPage] = React.useState(0);
  const [currentReplyPage, setCurrentReplyPage] = React.useState(0);
  const [currentWordPage, setCurrentWordPage] = React.useState(0);

  console.log("DashboardCharts: received timelineActivityData:", timelineActivityData);
  console.log("DashboardCharts: received timePatternsData:", timePatternsData);
  console.log("DashboardCharts: received replyTimeStats:", replyTimeStats);

  // Function to handle data download
  const handleDownload = (chartName: string, data: any) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${chartName}-data.json`;
    link.click();
  }

  // Chart toolbar component
  const ChartToolbar = ({ title, data }: { title: string; data?: any[] }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="space-y-1">
        <CardTitle>{title}</CardTitle>
        {/* Descriptions can be more dynamic or removed if Card content is self-explanatory */}
      </div>
      {data && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleDownload(title, data)}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      )}
    </div>
  )

  // Prepare data for User Sentiment Bar Chart
  const userSentimentChartData = React.useMemo(() => {
    if (!sentimentData || !sentimentData.sentiments) return [];
    return Object.entries(sentimentData.sentiments).map(([user, values]: [string, [string, string]]) => ({
      user,
      positive: parseFloat(values[0]),
      negative: parseFloat(values[1]),
    }));
  }, [sentimentData]);

  // Helper to format date strings (optional)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString; // fallback to original string if parsing fails
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

  // Messages per User Chart
  const userChartConfig = {
    messages: { label: "Messages", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const topEmojis = React.useMemo(() => {
    if (!emojiData || !emojiData.emoji_usage) return [];
    return emojiData.emoji_usage.slice(0, 8);
  }, [emojiData]);

  // Word Usage Chart Config & Data
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
    // Already sorted by engine: fastest first
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
    return replyTimeStats[0]; // Already sorted fastest first
  }, [replyTimeStats]);

  const slowestReplier = React.useMemo(() => {
    if (!replyTimeStats || replyTimeStats.length === 0) return null;
    // Create a new array sorted by slowest first
    const sortedSlowest = [...replyTimeStats].sort((a, b) => (b.average_reply_time_seconds ?? -Infinity) - (a.average_reply_time_seconds ?? -Infinity));
    return sortedSlowest[0];
  }, [replyTimeStats]);

  const replyTimeChartConfig = {
    time: { label: "Avg. Reply Time (sec)", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {/* Basic Statistics Card (Order 1) */}
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <ChartToolbar title="Basic Chat Statistics" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-10 gap-4 text-sm">
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2">
            <MessageSquareText className="h-6 w-6 text-primary mb-1" />
            <p className="font-semibold">{basicStats.total_messages.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">Total Messages</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2">
            <TextSelect className="h-6 w-6 text-primary mb-1" />
            <p className="font-semibold">{basicStats.total_words.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">Total Words</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2">
            <Users className="h-6 w-6 text-primary mb-1" />
            <p className="font-semibold">{basicStats.total_users.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">Unique Users</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2">
            <ExternalLink className="h-6 w-6 text-primary mb-1" />
            <p className="font-semibold">{basicStats.total_links.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">Links Shared</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 md:col-span-2">
            <ImageOff className="h-6 w-6 text-primary mb-1" />
            <p className="font-semibold">{basicStats.total_media_omitted.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs">Media Shared</p>
          </div>
          <Collapsible
            open={isFirstMsgOpen}
            onOpenChange={setIsFirstMsgOpen}
            className="flex flex-col items-start p-3 rounded-lg bg-muted/50 sm:col-span-2 md:col-span-5"
          >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                    <CalendarDays className="h-5 w-5 text-primary mr-2" />
                    <p className="text-xs text-muted-foreground">
                        First Message: <span className="font-semibold text-foreground">{formatDate(basicStats.first_message_date)}</span>
                        {basicStats.first_message_sender && <span className="italic text-muted-foreground ml-1">by {basicStats.first_message_sender}</span>}
                    </p>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isFirstMsgOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="sr-only">Toggle first message</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="w-full pt-1 text-xs text-muted-foreground mt-1 overflow-hidden">
              <p className="break-words whitespace-pre-wrap">{basicStats.first_message_text || 'N/A'}</p>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible
            open={isLastMsgOpen}
            onOpenChange={setIsLastMsgOpen}
            className="flex flex-col items-start p-3 rounded-lg bg-muted/50 sm:col-span-2 md:col-span-5"
          >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                    <CalendarDays className="h-5 w-5 text-primary mr-2" />
                    <p className="text-xs text-muted-foreground">
                        Last Message: <span className="font-semibold text-foreground">{formatDate(basicStats.last_message_date)}</span>
                        {basicStats.last_message_sender && <span className="italic text-muted-foreground ml-1">by {basicStats.last_message_sender}</span>}
                    </p>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isLastMsgOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="sr-only">Toggle last message</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="w-full pt-1 text-xs text-muted-foreground mt-1 overflow-hidden">
              <p className="break-words whitespace-pre-wrap">{basicStats.last_message_text || 'N/A'}</p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* User Activity Section with Tabs (Order 2) */}
      {userActivity && userActivity.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <Tabs defaultValue="donut" className="w-full">
            <CardHeader className="px-2 sm:px-6 pt-2 sm:pt-4 pb-0"> {/* Moved TabsList to CardHeader for consistent styling */}
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="donut">Activity Donut</TabsTrigger>
                  <TabsTrigger value="bar">Activity Bar Chart</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <TabsContent value="donut">
              {/* Donut Chart for Top 8 User Activity - Placed within a Card for its own Toolbar */}
              <Card className="border-none shadow-none">
                <CardHeader>
                  <ChartToolbar title="Top 8 User Activity (Messages)" data={sortedUserActivity.slice(0, 8)} />
                </CardHeader>
                <CardContent className="p-0 sm:p-6 flex items-center justify-center">
                  <div className="h-[350px] w-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sortedUserActivity.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          innerRadius={70}
                          dataKey="message_count"
                          nameKey="user"
                          paddingAngle={2}
                        >
                          {sortedUserActivity.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-user-donut-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number, name: string) => [value.toLocaleString(), `Messages by ${name}`]} />
                        <Legend 
                          iconSize={10} 
                          formatter={(value) => {
                              const userName = value as string;
                              return <span style={{ color: (COLORS[sortedUserActivity.findIndex(u => u.user === userName)%COLORS.length] || '#000') }}>{userName.length > 20 ? userName.slice(0, 18) + '...' : userName}</span>;
                          }}
                          wrapperStyle={{fontSize: '12px'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bar">
              {/* Bar Chart for Messages per User - Placed within a Card for its own Toolbar */}
              <Card className="border-none shadow-none">
                <CardHeader>
                  <ChartToolbar title="Messages per User (Bar)" data={visibleUserActivity} />
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={visibleUserActivity}
                        margin={{ top: 5, right: 20, bottom: 70, left: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="user" 
                          angle={-45} 
                          textAnchor="end" 
                          interval={0}
                          height={80}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Messages"]} />
                        <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="message_count" position="top" formatter={(value: number) => value.toLocaleString()} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {sortedUserActivity.length > USERS_PER_PAGE && (
                    <div className="mt-4 flex justify-center items-center gap-2">
                      <Button 
                        onClick={handlePreviousUsersPage} 
                        variant="outline"
                        disabled={currentUserPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentUserPage + 1} of {totalUserPages}
                      </span>
                      <Button 
                        onClick={handleNextUsersPage} 
                        variant="outline"
                        disabled={(currentUserPage + 1) * USERS_PER_PAGE >= sortedUserActivity.length}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Message Activity Timeline Chart (Order 3) */}
      {timelineActivityData && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <ChartToolbar title="Message Activity Timeline" data={timelineActivityData[timelineGranularity]} />
              <Tabs value={timelineGranularity} onValueChange={(value) => setTimelineGranularity(value as any)} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex h-9">
                  <TabsTrigger value="daily" className="text-xs px-2 sm:px-3">Daily</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-2 sm:px-3">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="text-xs px-2 sm:px-3">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineActivityData[timelineGranularity]} margin={{ top: 5, right: 20, bottom: 50, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="time_unit" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    interval={Math.max(0, Math.floor((timelineActivityData[timelineGranularity]?.length || 0) / 15) -1)}
                    tickFormatter={(tick) => {
                      if (timelineGranularity === 'yearly') return tick;
                      if (timelineGranularity === 'monthly') {
                        const [year, month] = tick.split('-');
                        return `${new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'short' })} \'${year.slice(2)}`;
                      }
                      return tick;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => {
                       if (timelineGranularity === 'yearly') return `Year: ${label}`;
                       if (timelineGranularity === 'monthly') {
                         const [year, month] = label.split('-');
                         return `Month: ${new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
                       }
                       return `Date: ${label}`;
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}
                  />
                  <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hourly Message Activity Line Chart (Order 4) */}
      {timePatternsData && timePatternsData.hourly_activity && timePatternsData.hourly_activity.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <ChartToolbar title="Hourly Message Activity" data={timePatternsData.hourly_activity} />
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timePatternsData.hourly_activity.sort((a, b) => a.hour - b.hour)}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => {
                      const h = parseInt(hour, 10);
                      if (h === 0) return "12 AM";
                      if (h === 12) return "12 PM";
                      if (h < 12) return `${h} AM`;
                      return `${h - 12} PM`;
                    }}
                    interval={typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 1}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(label) => {
                      const h = parseInt(label, 10);
                      if (h === 0) return "12 AM";
                      if (h === 12) return "12 PM";
                      if (h < 12) return `${h} AM`;
                      return `${h - 12} PM`;
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="message_count" name="Messages" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Hourly Activity Bar Chart (Order 5) */}
      {timePatternsData && timePatternsData.hourly_activity && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0">
            <ChartToolbar title="Hourly Activity (All Messages)" data={timePatternsData.hourly_activity} />
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timePatternsData.hourly_activity} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="hour" name="Hour of Day" 
                    tickFormatter={(hour) => {
                      const h = parseInt(hour, 10);
                      if (h === 0) return "12 AM";
                      if (h === 12) return "12 PM";
                      if (h < 12) return `${h} AM`;
                      return `${h - 12} PM`;
                    }}/>
                  <YAxis name="Messages" allowDecimals={false} />
                  <Tooltip 
                     labelFormatter={(label) => {
                      const h = parseInt(label, 10);
                      if (h === 0) return "12 AM";
                      if (h === 12) return "12 PM";
                      if (h < 12) return `${h} AM`;
                      return `${h - 12} PM`;
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Messages"]}/>
                  <Legend />
                  <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Word Usage and Emoji Usage Tabs (Order 6 - Restyled) */}
      <div className="col-span-1 md:col-span-3">
        <Tabs defaultValue="wordUsage" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="wordUsage">Word Usage</TabsTrigger>
              <TabsTrigger value="emojiUsage">Emoji Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="wordUsage">
            <Card className="border-none shadow-none">
                <CardHeader className="pb-0">
                    <ChartToolbar title="Most Frequent Words" data={wordUsageChartData} />
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wordUsageChartData} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="word" type="category" width={80} />
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), "Frequency"]}/>
                        <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20}>
                           {/* Optional: LabelList if desired, might need position="right" */}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                {wordUsage && wordUsage.length > WORDS_PER_PAGE && (
                  <div className="mt-4 flex justify-center items-center gap-2">
                    <Button 
                      onClick={handlePreviousWords} 
                      variant="outline"
                      disabled={currentWordPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentWordPage + 1} of {totalUserPages}
                    </span>
                    <Button 
                      onClick={handleNextWords} 
                      variant="outline"
                      disabled={(currentWordPage + 1) * WORDS_PER_PAGE >= (wordUsage?.length || 0)}
                    >
                      Next
                    </Button>
                  </div>
                )}
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="emojiUsage">
            <Card className="border-none shadow-none">
                <CardHeader className="pb-0">
                    <ChartToolbar title="Top 8 Emoji Usage" data={topEmojis} />
                </CardHeader>
                <CardContent className="p-0 sm:p-6 flex items-center justify-center">
                    <div className="h-[300px] w-[300px]">
                        {emojiData && emojiData.emoji_usage && emojiData.emoji_usage.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie
                                data={topEmojis}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                innerRadius={60}
                                dataKey="count"
                                nameKey="emoji"
                                paddingAngle={2}
                            >
                                {topEmojis.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number, name: string) => [value.toLocaleString(), name]} />
                            <Legend iconSize={10} formatter={(value, entry) => <span style={{ color: entry.color }}>{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                        ) : (
                        <p className="text-center text-muted-foreground flex items-center justify-center h-full">No emoji data to display.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

            {/* Average Reply Time Chart (Order 9) */}
            {replyTimeStats && replyTimeStats.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <ChartToolbar title="Average User Reply Times" data={replyTimeStats} />
            <div className="text-sm text-muted-foreground pt-2 space-y-1">
              {fastestReplier && (
                <p>Fastest Average: <span className="font-semibold text-primary">{fastestReplier.user}</span> ({formatSecondsToTime(fastestReplier.average_reply_time_seconds)})</p>
              )}
              {slowestReplier && (
                <p>Slowest Average: <span className="font-semibold text-destructive">{slowestReplier.user}</span> ({formatSecondsToTime(slowestReplier.average_reply_time_seconds)})</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={visibleReplyTimeStats}
                  margin={{ top: 5, right: 30, bottom: 70, left: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="user" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                    height={80}
                    tickFormatter={(value) => value.slice(0, 12) + (value.length > 12 ? '...' : '')}
                  />
                  <YAxis 
                    dataKey="average_reply_time_seconds"
                    allowDecimals={false} 
                    label={{ value: "Avg. Reply Time", angle: -90, position: 'insideLeft', offset: -15, style: {fontSize: '0.8rem', fill: 'var(--primary)'} }}
                    tickFormatter={(value) => formatSecondsToTime(value)}
                    tickCount={6}
                    width={90}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                        return [formatSecondsToTime(value), `Avg. Reply Time (${props.payload.user})`];
                    }}
                    labelFormatter={(label) => ``}
                  />
                  <Bar dataKey="average_reply_time_seconds" name="Average Reply Time" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    <LabelList 
                        dataKey="average_reply_time_seconds" 
                        position="top" 
                        formatter={(value: number) => formatSecondsToTime(value)} 
                        fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {replyTimeStats.length > USERS_PER_PAGE && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <Button 
                  onClick={handlePreviousReplyPage} 
                  variant="outline"
                  disabled={currentReplyPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentReplyPage + 1} of {totalReplyPages}
                </span>
                <Button 
                  onClick={handleNextReplyPage} 
                  variant="outline"
                  disabled={(currentReplyPage + 1) * USERS_PER_PAGE >= replyTimeStats.length}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      


      {/* Per-User Statistics Section (Order 8) */}
      {userActivity && userActivity.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <ChartToolbar title="Per-User Statistics" data={userActivity} />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userActivity.map((stat) => (
              <Card key={stat.user} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{stat.user}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 flex-grow">
                  <p>Messages: <span className="font-semibold">{stat.message_count.toLocaleString()}</span></p>
                  <p>Words: <span className="font-semibold">{stat.word_count.toLocaleString()}</span></p>
                  <p>Avg. Msg Length: <span className="font-semibold">{stat.avg_message_length.toFixed(1)} words</span></p>
                  <p>Links Shared: <span className="font-semibold">{stat.links_shared_count.toLocaleString()}</span></p>
                  <p>Media Shared: <span className="font-semibold">{stat.media_shared_count.toLocaleString()}</span></p>
                  {stat.most_used_emojis && stat.most_used_emojis.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-medium">Top Emojis:</p>
                      <div className="flex flex-wrap gap-1 text-lg pt-0.5">
                        {stat.most_used_emojis.map(emojiStat => (
                          <span key={emojiStat.emoji} title={`${emojiStat.count} times`}>{emojiStat.emoji}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {stat.biggest_message && stat.biggest_message.length > 0 && (
                    <Collapsible className="pt-1">
                      <CollapsibleTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-xs">
                          Show Biggest Message ({stat.biggest_message.length} words)
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="text-xs text-muted-foreground mt-1 p-2 border rounded bg-muted/50 overflow-hidden">
                        <p className="break-words whitespace-pre-wrap">{stat.biggest_message.text}</p>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      


            {/* User Sentiment Analysis Chart (Order 7) */}
            <Card className="col-span-1 md:col-span-2">
        <CardHeader className="pb-0">
          <ChartToolbar title="User Sentiment Analysis" data={userSentimentChartData} />
          <div className="text-sm text-muted-foreground pt-2">
            <p>Most Positive: <span className="font-semibold text-primary">{sentimentData.most_positive}</span></p>
            <p>Most Negative: <span className="font-semibold text-destructive">{sentimentData.most_negative}</span></p>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userSentimentChartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="user" type="category" width={80} />
                <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                <Legend />
                <Bar dataKey="positive" name="Positive" stackId="a" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="negative" name="Negative" stackId="a" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>




      

      {/* Remaining/Unspecified Charts (Order 10 - Moved to End) */}
      <Card className="col-span-1">
        <CardHeader className="pb-0">
          <ChartToolbar title="Response Times" data={responseTimes} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimes} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-0">
          <ChartToolbar title="Message Length" data={messageLength} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageLength} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="length" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-0">
          <ChartToolbar title="Mood Shifts" data={moodShifts} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodShifts} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sentiment" stroke="var(--primary)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {conversationFlowData && conversationFlowData.conversation_stats && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0">
            <ChartToolbar title="Conversation Statistics" data={conversationFlowData.conversation_stats} />
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              {conversationFlowData.conversation_stats.length > 0 ? (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">End Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration (min)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Participants</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Msg Density</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {conversationFlowData.conversation_stats.map((stat) => (
                      <tr key={stat.conversation_id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{stat.conversation_id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(stat.start_time).toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(stat.end_time).toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{stat.duration.toFixed(2)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{stat.message_count}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{stat.participants}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{stat.message_density.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No conversation statistics available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {timePatternsData && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader><CardTitle>Time Patterns Data (Raw)</CardTitle></CardHeader>
          <CardContent><pre className="text-xs overflow-auto max-h-60 bg-muted p-2 rounded">{JSON.stringify(timePatternsData, null, 2)}</pre></CardContent>
        </Card>
      )}
      {conversationFlowData && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader><CardTitle>Conversation Flow Data (Raw)</CardTitle></CardHeader>
          <CardContent><pre className="text-xs overflow-auto max-h-60 bg-muted p-2 rounded">{JSON.stringify(conversationFlowData, null, 2)}</pre></CardContent>
        </Card>
      )}
    </div>
  )
}