"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  Label,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { UserActivityTable } from "./user-activity-table"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react"
import { UserStat } from "@/lib/analysis-engine"

import "../colors.css"

interface WordUsageData {
  total_words: number
  word_diversity: number
  words_per_message: number
  word_counts: Array<{
    word: string
    count: number
  }>
}

interface AnalysisChartsProps {
  wordUsageData?: WordUsageData
  userActivityData?: UserStat[]
}

const THEME_AWARE_COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const WORDS_PER_PAGE = 10;

export function AnalysisCharts({ wordUsageData, userActivityData }: AnalysisChartsProps) {
  const [wordUsageCurrentPage, setWordUsageCurrentPage] = React.useState(0);

  const sortedWordCounts = React.useMemo(() => {
    return wordUsageData?.word_counts?.sort((a, b) => b.count - a.count) || [];
  }, [wordUsageData]);

  const wordUsageChartData = React.useMemo(() => {
    const startIndex = wordUsageCurrentPage * WORDS_PER_PAGE;
    const endIndex = startIndex + WORDS_PER_PAGE;
    return sortedWordCounts.slice(startIndex, endIndex).map(item => ({
      name: item.word,
      count: item.count
    }));
  }, [sortedWordCounts, wordUsageCurrentPage]);

  const totalWordUsagePages = Math.ceil((sortedWordCounts?.length || 0) / WORDS_PER_PAGE);

  const handleNextWordPage = () => {
    setWordUsageCurrentPage(prevPage => Math.min(prevPage + 1, totalWordUsagePages - 1));
  };

  const handlePrevWordPage = () => {
    setWordUsageCurrentPage(prevPage => Math.max(prevPage - 1, 0));
  };

  const totalMessages = React.useMemo(() => {
    return userActivityData?.reduce((acc, curr) => acc + curr.message_count, 0) || 0;
  }, [userActivityData]);

  const userActivityChartDataForPie = React.useMemo(() => {
    if (!userActivityData || userActivityData.length === 0) return [];
    // For pie chart, we might want to aggregate smaller slices if there are too many users
    // For now, let's take top 5 and aggregate the rest if more than 6 users, similar to table logic.
    // Or, match the table behavior: if > 6, table shown, so pie chart might not be primary display.
    // Let's keep it simple for now and chart all users or top N for the pie.
    // The component already conditionally renders Table if > 6 users.
    return userActivityData.map(stat => ({
      name: stat.user, 
      value: stat.message_count 
    }));
  }, [userActivityData]);

  const chartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-1))", 
    },
    messages: {
      label: "Messages",
      color: "hsl(var(--chart-1))", 
    },
  } satisfies ChartConfig;

  const barChartWidth = 500;

  if (!wordUsageData && !userActivityData) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Analysis Data Not Available</CardTitle>
                <CardDescription>Please upload and process a chat file first.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Tabs defaultValue="user-activity" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="user-activity">User Activity</TabsTrigger>
        <TabsTrigger value="word-usage" disabled={!wordUsageData || wordUsageData.word_counts.length === 0}>Word Usage</TabsTrigger>
      </TabsList>
      <TabsContent value="user-activity">
        <Card>
          <CardHeader>
            <CardTitle>User Activity Overview</CardTitle>
            <CardDescription>
              Message and word counts per user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userActivityData && userActivityData.length > 0 ? (
              userActivityData.length > 6 ? (
                <div className="max-h-[450px] overflow-y-auto">
                  <UserActivityTable userStats={userActivityData} totalOverallMessages={totalMessages} />
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square h-[400px]"
                >
                  <PieChart>
                    <Pie
                      data={userActivityChartDataForPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      startAngle={0}
                      endAngle={360}
                      strokeWidth={5}
                    >
                      {userActivityChartDataForPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={THEME_AWARE_COLORS[index % THEME_AWARE_COLORS.length]} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-3xl font-bold"
                                >
                                  {totalMessages.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-muted-foreground"
                                >
                                  Messages
                                </tspan>
                              </text>
                            )
                          }
                          return null;
                        }}
                      />
                    </Pie>
                    <RechartsTooltip 
                        formatter={(value: number, name: string, props: any) => {
                            const percentage = totalMessages > 0 ? (value / totalMessages * 100).toFixed(1) : 0;
                            return [`${value.toLocaleString()} messages (${percentage}%)`, name];
                        }}
                    />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              )
            ) : (
              <p className="text-center text-muted-foreground">No user activity data to display.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="word-usage">
        {wordUsageData && wordUsageData.word_counts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Most Used Words</CardTitle>
              <CardDescription>
                Word frequency analysis from the chat (Top {WORDS_PER_PAGE} shown per page).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
                <BarChart data={wordUsageChartData} width={barChartWidth} height={400} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={100} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 8, 8, 0]} layout="vertical" />
                </BarChart>
              </ChartContainer>
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevWordPage}
                  disabled={wordUsageCurrentPage === 0}
                  size="icon"
                >
                  <IconArrowLeft className="h-4 w-4" />
                </Button>
                <span>Page {wordUsageCurrentPage + 1} of {totalWordUsagePages}</span>
                <Button
                  variant="outline"
                  onClick={handleNextWordPage}
                  disabled={wordUsageCurrentPage >= totalWordUsagePages - 1}
                  size="icon"
                >
                  <IconArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Most Used Words</CardTitle></CardHeader>
            <CardContent><p className="text-center text-muted-foreground">No word usage data to display.</p></CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
} 