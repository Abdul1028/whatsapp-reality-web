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
import { Download, RefreshCw } from "lucide-react"

// Color array for charts
const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface DashboardChartsProps {
  sentimentData: {
    sentiments: {
      positive: number
      negative: number
      neutral: number
    }
    most_positive: string[]
    most_negative: string[]
  }
  emojiData: {
    emoji_usage: Array<{
      emoji: string
      count: number
    }>
  }
  conversationPatterns: any
  responseTimes: any
  wordUsage: any
  messageLength: any
  moodShifts: any
}

export function DashboardCharts({
  sentimentData,
  emojiData,
  conversationPatterns,
  responseTimes,
  wordUsage,
  messageLength,
  moodShifts,
}: DashboardChartsProps) {
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Function to handle data download
  const handleDownload = (chartName: string, data: any[]) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`
    const link = document.createElement("a")
    link.href = jsonString
    link.download = `${chartName}-data.json`
    link.click()
  }

  // Chart toolbar component
  const ChartToolbar = ({ title, data }: { title: string; data: any[] }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {title === "Sentiment Analysis"
            ? "Distribution of message sentiments"
            : title === "Emoji Usage"
            ? "Most frequently used emojis"
            : title === "Response Times"
            ? "Average response times between messages"
            : title === "Word Usage"
            ? "Most commonly used words"
            : title === "Message Length"
            ? "Distribution of message lengths"
            : "Mood shifts over time"}
        </CardDescription>
      </div>
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
    </div>
  )

  // Convert sentiment data for pie chart
  const sentimentChartData = [
    { name: "Positive", value: sentimentData.sentiments.positive },
    { name: "Neutral", value: sentimentData.sentiments.neutral },
    { name: "Negative", value: sentimentData.sentiments.negative },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {/* Sentiment Analysis Chart */}
      <Card className="col-span-1">
        <CardHeader className="pb-0">
          <ChartToolbar title="Sentiment Analysis" data={sentimentChartData} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sentimentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emojiData.emoji_usage.slice(0, 10)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="emoji" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
    </div>
  )
}