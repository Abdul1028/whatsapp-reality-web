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
import { UserStat, TimelineActivityData, ActivityPoint } from "@/lib/analysis-engine"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
interface EmojiData {
  emoji_usage: EmojiUsage[];
}

// Copied from page.tsx for consistency
interface HourlyActivity {
  hour: number;
  message_count: number;
}
interface DailyActivity {
  day_name: string;
  message_count: number;
}
interface MonthlyActivity {
  month: string;
  month_num: number;
  message_count: number;
}
type UserHourlyActivity = {
  hour: number;
} & {
  [user: string]: number;
};
type UserDailyActivity = {
  day_name: string;
} & {
  [user: string]: number;
};
interface TimePatternsData {
  hourly_activity: HourlyActivity[];
  daily_activity: DailyActivity[];
  monthly_activity: MonthlyActivity[];
  user_hourly: UserHourlyActivity[];
  user_daily: UserDailyActivity[];
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

export interface BasicStatsData {
  total_messages: number;
  total_words: number;
  total_users: number;
  first_message_date: string | null;
  last_message_date: string | null;
  first_message_text: string | null;
  last_message_text: string | null;
  first_message_sender: string | null;
  last_message_sender: string | null;
  total_links: number;
  total_media_omitted: number;
}

interface DashboardChartsProps {
  basicStats: BasicStatsData;
  userActivity?: UserStat[];
  sentimentData: SentimentData;
  emojiData: EmojiData;
  conversationPatterns?: any; // Made optional
  responseTimes?: any;        // Made optional
  wordUsage: WordCount[];
  messageLength: any;
  moodShifts: any;
  timePatternsData?: TimePatternsData;
  conversationFlowData?: ConversationFlowData;
  timelineActivityData?: TimelineActivityData; // Added prop
}

export function DashboardCharts({
  basicStats,
  userActivity,
  sentimentData,
  emojiData,
  conversationPatterns, // Still here, but usage is unclear
  responseTimes,
  wordUsage,
  messageLength,
  moodShifts,
  timePatternsData,
  conversationFlowData,
  timelineActivityData, // Added prop
}: DashboardChartsProps) {
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [isFirstMsgOpen, setIsFirstMsgOpen] = React.useState(false);
  const [isLastMsgOpen, setIsLastMsgOpen] = React.useState(false);
  const [timelineGranularity, setTimelineGranularity] = React.useState<"daily" | "monthly" | "yearly">("monthly");

  console.log("DashboardCharts: received timelineActivityData:", timelineActivityData);

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
    return Object.entries(sentimentData.sentiments).map(([user, values]) => ({
      user: user.trim(), // Remove leading space if any
      positive: parseFloat(values[0]), // Convert percentage string to number
      negative: parseFloat(values[1]), // Convert percentage string to number
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {/* Basic Statistics Card */}
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
          
          {/* First Message - Collapsible */}
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

          {/* Last Message - Collapsible */}
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

      {/* User Sentiment Analysis Chart (Replaces old Pie Chart) */}
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

      {/* Emoji Usage Chart */}
      <Card className="col-span-1">
        <CardHeader className="pb-0">
          <ChartToolbar title="Emoji Usage" data={emojiData.emoji_usage} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            {emojiData && emojiData.emoji_usage && emojiData.emoji_usage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emojiData.emoji_usage.slice(0,10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" />
                        <YAxis dataKey="emoji" type="category" width={40}/>
                        <Tooltip formatter={(value: number, name: string) => [value, name]} />
                        <Bar dataKey="count" name="Count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center text-muted-foreground flex items-center justify-center h-full">No emoji data to display.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Times Chart */}
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

      {/* Word Usage Chart */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-0">
          <ChartToolbar title="Word Usage" data={wordUsage} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wordUsage.slice(0, 20)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="word" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Message Length Chart */}
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

      {/* Mood Shifts Chart */}
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

      {/* Hourly Activity Chart */}
      {timePatternsData && timePatternsData.hourly_activity && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0">
            <ChartToolbar title="Hourly Activity" data={timePatternsData.hourly_activity} />
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timePatternsData.hourly_activity} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="hour" name="Hour of Day" />
                  <YAxis name="Messages" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="message_count" name="Messages" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Statistics Table */}
      {conversationFlowData && conversationFlowData.conversation_stats && (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-0">
            {/* Data for download might need to be conversationFlowData itself or conversationFlowData.conversation_stats */}
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

      {/* Placeholder cards for TimePatterns and ConversationFlow if data exists */}
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

      {/* Message Activity Timeline Chart */}
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
                    interval={Math.max(0, Math.floor((timelineActivityData[timelineGranularity]?.length || 0) / 15) -1)} // Adjust interval to prevent clutter
                    tickFormatter={(tick) => {
                      if (timelineGranularity === 'yearly') return tick;
                      if (timelineGranularity === 'monthly') {
                        const [year, month] = tick.split('-');
                        return `${new Date(Number(year), Number(month)-1).toLocaleString('default', { month: 'short' })} \'${year.slice(2)}`;
                      }
                      // Daily: could format as "MMM DD" or similar if space is an issue
                      return tick; // Default daily tick
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

      {/* Per-User Statistics Section */}
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
    </div>
  )
}