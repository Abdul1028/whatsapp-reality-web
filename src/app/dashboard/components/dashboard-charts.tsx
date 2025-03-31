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
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Sample data for charts
const barChartData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
]

const lineChartData = [
  { date: "Jan 1", visitors: 100 },
  { date: "Jan 15", visitors: 150 },
  { date: "Feb 1", visitors: 200 },
  { date: "Feb 15", visitors: 120 },
  { date: "Mar 1", visitors: 180 },
  { date: "Mar 15", visitors: 250 },
]

const pieChartData = [
  { name: "Chrome", value: 68.85 },
  { name: "Firefox", value: 7.91 },
  { name: "Edge", value: 6.85 },
  { name: "Safari", value: 14.23 },
  { name: "Other", value: 2.16 },
]

const areaChartData = [
  { date: "Jan", users: 400, sessions: 700, pageviews: 1400 },
  { date: "Feb", users: 500, sessions: 800, pageviews: 1600 },
  { date: "Mar", users: 600, sessions: 1000, pageviews: 2000 },
  { date: "Apr", users: 400, sessions: 700, pageviews: 1400 },
  { date: "May", users: 700, sessions: 1100, pageviews: 2200 },
  { date: "Jun", users: 800, sessions: 1300, pageviews: 2600 },
]

const radialBarData = [
  { name: "18-24", value: 31 },
  { name: "25-34", value: 58 },
  { name: "35-44", value: 42 },
  { name: "45-54", value: 25 },
  { name: "55+", value: 13 },
]

const scatterData = [
  { x: 10, y: 30, z: 200, name: "Product A" },
  { x: 30, y: 50, z: 100, name: "Product B" },
  { x: 45, y: 20, z: 150, name: "Product C" },
  { x: 50, y: 40, z: 300, name: "Product D" },
  { x: 70, y: 70, z: 120, name: "Product E" },
  { x: 80, y: 30, z: 250, name: "Product F" },
]

// Chart configurations
const barChartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const lineChartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const pieChartConfig = {
  chrome: { label: "Chrome", color: "var(--primary)" },
  firefox: { label: "Firefox", color: "var(--chart-2)" },
  edge: { label: "Edge", color: "var(--chart-3)" },
  safari: { label: "Safari", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig

const areaChartConfig = {
  users: { label: "Users", color: "var(--primary)" },
  sessions: { label: "Sessions", color: "var(--chart-2)" },
  pageviews: { label: "Pageviews", color: "var(--chart-4)" },
} satisfies ChartConfig

const radialBarConfig = {
  age1824: { label: "18-24", color: "var(--primary)" },
  age2534: { label: "25-34", color: "var(--chart-2)" },
  age3544: { label: "35-44", color: "var(--chart-3)" },
  age4554: { label: "45-54", color: "var(--chart-4)" },
  age55plus: { label: "55+", color: "var(--chart-5)" },
} satisfies ChartConfig

const scatterConfig = {
  product: { label: "Product", color: "var(--primary)" },
} satisfies ChartConfig

// COLORS array for pie chart
const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Bar Chart */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Traffic</CardTitle>
          <CardDescription>
            Desktop vs mobile visitors over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px]">
            <BarChart accessibilityLayer data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="desktop"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="mobile"
                fill="var(--chart-3)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Trend</CardTitle>
          <CardDescription>Daily visitor count</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[300px]">
            <LineChart accessibilityLayer data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.split(" ")[0]}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                domain={[0, 'dataMax + 50']}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="var(--primary)"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Improved */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Share</CardTitle>
          <CardDescription>Distribution by browser</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="h-[300px]">
            <PieChart accessibilityLayer>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
              >
                {pieChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Area Chart - New */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Website Analytics</CardTitle>
          <CardDescription>Users, sessions and pageviews</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className="h-[300px]">
            <AreaChart accessibilityLayer data={areaChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="pageviews"
                stackId="1"
                stroke="var(--chart-4)"
                fill="var(--chart-4)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stackId="1"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="users"
                stackId="1"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Radial Bar Chart - New */}
      <Card>
        <CardHeader>
          <CardTitle>Age Demographics</CardTitle>
          <CardDescription>User age distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={radialBarConfig} className="h-[300px]">
            <RadialBarChart 
              accessibilityLayer 
              data={radialBarData} 
              innerRadius="20%" 
              outerRadius="90%" 
              startAngle={180} 
              endAngle={0}
              cx="50%"
              cy="60%"
            >
              <RadialBar
                label={{ fill: 'var(--foreground)', position: 'insideStart', fontSize: 12 }}
                background
                dataKey="value"
              >
                {radialBarData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </RadialBar>
              <Legend 
                iconSize={10} 
                layout="horizontal" 
                verticalAlign="top" 
                align="center"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Tooltip formatter={(value) => `${value}%`} />
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Scatter Chart - New */}
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Price vs. Rating vs. Sales Volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={scatterConfig} className="h-[350px]">
            <ScatterChart accessibilityLayer margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Price" 
                unit="$"
                label={{ value: 'Price ($)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Rating" 
                unit="/100"
                label={{ value: 'Rating', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name, props) => {
                  if (name === 'z') return [`${value} units`, 'Sales Volume'];
                  if (name === 'x') return [`$${value}`, 'Price'];
                  if (name === 'y') return [`${value}/100`, 'Rating'];
                  return [value, name];
                }}
              />
              <Scatter 
                name="Products" 
                data={scatterData} 
                fill="var(--primary)"
              >
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Scatter>
              <Legend />
            </ScatterChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
} 