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
import { Download, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"

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

// Color array for charts
const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function DashboardCharts() {
  const [activeTab, setActiveTab] = React.useState("daily")
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
          {title === "Monthly Traffic"
            ? "Desktop vs mobile visitors over the last 6 months"
            : title === "Visitor Trend"
            ? "Daily visitor count"
            : title === "Browser Share"
            ? "Distribution by browser"
            : title === "Website Analytics"
            ? "Users, sessions and pageviews"
            : title === "Age Demographics"
            ? "User age distribution"
            : "Price vs. Rating vs. Sales Volume"}
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {/* Monthly Traffic Chart */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-0">
          <ChartToolbar title="Monthly Traffic" data={barChartData} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs defaultValue="bar" className="w-full">
            <div className="flex justify-center p-1">
              <TabsList>
                <TabsTrigger value="bar">Bar</TabsTrigger>
                <TabsTrigger value="stacked">Stacked</TabsTrigger>
                <TabsTrigger value="line">Line</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="bar" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar 
                      dataKey="desktop" 
                      name="Desktop" 
                      fill="var(--primary)" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                    />
                    <Bar 
                      dataKey="mobile" 
                      name="Mobile" 
                      fill="var(--chart-3)" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="stacked" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar 
                      dataKey="desktop" 
                      name="Desktop" 
                      stackId="a" 
                      fill="var(--primary)" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                    />
                    <Bar 
                      dataKey="mobile" 
                      name="Mobile" 
                      stackId="a" 
                      fill="var(--chart-3)" 
                      radius={[0, 0, 0, 0]} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="line" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={barChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="desktop" 
                      name="Desktop" 
                      stroke="var(--primary)" 
                      strokeWidth={2} 
                      dot={{ r: 5 }} 
                      activeDot={{ r: 8 }}
                      animationDuration={1500}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mobile" 
                      name="Mobile" 
                      stroke="var(--chart-3)" 
                      strokeWidth={2} 
                      dot={{ r: 5 }} 
                      activeDot={{ r: 8 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Visitor Trend Chart */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-0">
          <ChartToolbar title="Visitor Trend" data={lineChartData} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs defaultValue="daily" className="w-full">
            <div className="flex justify-center p-1">
              <TabsList>
                <TabsTrigger value="daily" onClick={() => setActiveTab("daily")}>
                  Daily
                </TabsTrigger>
                <TabsTrigger value="weekly" onClick={() => setActiveTab("weekly")}>
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="monthly" onClick={() => setActiveTab("monthly")}>
                  Monthly
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={activeTab} className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => value.split(" ")[0]}
                    />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                    />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      name="Visitors"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 6, fill: 'var(--primary)' }}
                      activeDot={{ r: 8 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Browser Share Chart */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-0">
          <ChartToolbar title="Browser Share" data={pieChartData} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs defaultValue="pie" className="w-full">
            <div className="flex justify-center p-1">
              <TabsList>
                <TabsTrigger value="pie">Pie</TabsTrigger>
                <TabsTrigger value="donut">Donut</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="pie" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      animationDuration={1500}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                      formatter={(value) => `${value}%`}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="donut" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      animationDuration={1500}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                      formatter={(value) => `${value}%`}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Website Analytics Chart */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-0">
          <ChartToolbar title="Website Analytics" data={areaChartData} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs defaultValue="stacked" className="w-full">
            <div className="flex justify-center p-1">
              <TabsList>
                <TabsTrigger value="stacked">Stacked</TabsTrigger>
                <TabsTrigger value="overlay">Overlay</TabsTrigger>
                <TabsTrigger value="composed">Composed</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="stacked" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      name="Pageviews"
                      stackId="1"
                      stroke="var(--chart-4)"
                      fill="var(--chart-4)"
                      fillOpacity={0.6}
                      animationDuration={1500}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      name="Sessions"
                      stackId="1"
                      stroke="var(--chart-2)"
                      fill="var(--chart-2)"
                      fillOpacity={0.6}
                      animationDuration={1500}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Users"
                      stackId="1"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.6}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="overlay" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      name="Pageviews"
                      stroke="var(--chart-4)"
                      fill="var(--chart-4)"
                      fillOpacity={0.3}
                      animationDuration={1500}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      name="Sessions"
                      stroke="var(--chart-2)"
                      fill="var(--chart-2)"
                      fillOpacity={0.3}
                      animationDuration={1500}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Users"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.3}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="composed" className="mt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={areaChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      name="Pageviews"
                      stroke="var(--chart-4)"
                      fill="var(--chart-4)"
                      fillOpacity={0.3}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      name="Sessions"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="users"
                      name="Users"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Radial Bar Chart */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-0">
          <ChartToolbar title="Age Demographics" data={radialBarData} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                data={radialBarData} 
                innerRadius="20%" 
                outerRadius="80%" 
                startAngle={180} 
                endAngle={0}
                cx="50%"
                cy="50%"
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <RadialBar
                  label={{ 
                    fill: 'var(--foreground)', 
                    position: 'insideStart', 
                    fontSize: 12 
                  }}
                  background
                  dataKey="value"
                  animationDuration={1500}
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
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                  }} 
                  formatter={(value) => `${value}%`}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scatter Chart */}
      <Card className="col-span-1 md:col-span-3 lg:col-span-3 overflow-hidden">
        <CardHeader className="pb-0">
          <ChartToolbar title="Product Performance" data={scatterData} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                  }} 
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
                  animationDuration={1500}
                >
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Scatter>
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}