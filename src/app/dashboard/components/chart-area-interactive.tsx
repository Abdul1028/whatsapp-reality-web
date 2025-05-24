"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
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

interface TimelineDataPoint {
  date: string
  messages: number
  words: number
}

interface TimelineData {
  monthly: TimelineDataPoint[]
  daily: TimelineDataPoint[]
}

interface ChartAreaInteractiveProps {
  data: TimelineData
}

// Remove the hardcoded chartData and chartConfig
// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ]

// const chartConfig = {
//   desktop: {
//     label: "Desktop",
//     color: "var(--primary)",
//   },
//   mobile: {
//     label: "Mobile",
//     color: "var(--primary)",
//   },
// } satisfies ChartConfig

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const [activeTab, setActiveTab] = React.useState("monthly")

  const chartData = activeTab === "monthly" ? data.monthly : data.daily;

  // Define chart config based on timeline data
  const chartConfig = {
    messages: {
      label: "Messages",
      color: "hsl(var(--primary))", // Using a HSL color variable
    },
    words: {
      label: "Words",
      color: "hsl(var(--secondary))", // Using another color variable
    },
  } as const; // Using 'as const' for ChartConfig type safety

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 [&>h5]:-****:data-[slot=title]:leading-7">
        <CardTitle>Message Timeline</CardTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-7 grid grid-cols-2 px-0 text-xs">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // Format date ticks based on the active tab
                tickFormatter={(value) => 
                  activeTab === "monthly" ? value : value.slice(5) // Show MM-DD for daily
                }
              />
              <YAxis />
              <Tooltip />
              {/* Display Area for Messages */}
              <Area
                dataKey="messages"
                type="natural"
                fill="var(--color-messages)"
                fillOpacity={0.4}
                stroke="var(--color-messages)"
                stackId="a"
              />
              {/* Display Area for Words */}
              <Area
                dataKey="words"
                type="natural"
                fill="var(--color-words)"
                fillOpacity={0.3}
                stroke="var(--color-words)"
                stackId="a"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}