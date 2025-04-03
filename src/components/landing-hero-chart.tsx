"use client"

import React, { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

// --- Chart Theme Definitions ---
type ChartTheme = "default" | "blue" | "green" | "orange";

const chartThemes: Record<ChartTheme, Record<string, string>> = {
  default: {
    "--chart-1": "#a3a85e", // Ghibli chart-1
    "--chart-2": "#c7a85a", // Ghibli chart-2
    "--chart-3": "#c7805a", // Ghibli chart-3
    "--chart-4": "#a0b8c0", // Ghibli chart-4
    "--chart-5": "#8C7C6D", // Ghibli chart-5
  },
  blue: {
    "--chart-1": "hsl(221.2 83.2% 53.3%)", // Example Blue
    "--chart-2": "hsl(215.4 70.5% 65.3%)",
    "--chart-3": "hsl(210 60% 75%)",
    "--chart-4": "hsl(205 50% 85%)",
    "--chart-5": "hsl(200 40% 90%)",
  },
  green: {
    "--chart-1": "hsl(142.1 76.2% 36.3%)", // Example Green
    "--chart-2": "hsl(145 65% 45%)",
    "--chart-3": "hsl(150 55% 55%)",
    "--chart-4": "hsl(155 45% 70%)",
    "--chart-5": "hsl(160 35% 85%)",
  },
    orange: {
    "--chart-1": "hsl(24.6 95% 53.1%)", // Example Orange
    "--chart-2": "hsl(28 90% 60%)",
    "--chart-3": "hsl(32 85% 68%)",
    "--chart-4": "hsl(36 80% 78%)",
    "--chart-5": "hsl(40 75% 88%)",
  },
};


// --- Helper Functions for Random Data ---

// Generate random names
const randomNames = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi"]
const getRandomName = () => randomNames[Math.floor(Math.random() * randomNames.length)]

// Generate data for Bar Chart (Messages per User)
const generateBarData = (count = 5) => {
  const data = []
  const usedNames = new Set<string>()
  for (let i = 0; i < count; i++) {
    let name = getRandomName()
    while (usedNames.has(name)) {
      name = getRandomName()
    }
    usedNames.add(name)
    data.push({
      user: name,
      messages: Math.floor(Math.random() * 150) + 20, // Random message count between 20 and 170
    })
  }
  return data.sort((a, b) => b.messages - a.messages); // Sort descending
}

// Generate data for Line Chart (Messages over Time)
const generateLineData = (days = 7) => {
  const data = []
  let date = new Date()
  date.setDate(date.getDate() - days) // Start from 'days' ago
  for (let i = 0; i < days; i++) {
    date.setDate(date.getDate() + 1)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      messages: Math.floor(Math.random() * 80) + 10, // Random messages per day
    })
  }
  return data
}

// Re-enable Pie Chart Data Generation (using CSS vars defined in config)
const generatePieData = () => {
    const total = 100;
    const text = Math.floor(Math.random() * 60) + 30;
    const media = Math.floor(Math.random() * (total - text - 5)) + 5;
    const links = total - text - media;

    return [
        { type: "Text", value: text, fill: "var(--color-Text)" },
        { type: "Media", value: media, fill: "var(--color-Media)" },
        { type: "Links", value: links, fill: "var(--color-Links)" },
    ].filter(d => d.value > 0);
}

// Generate data for Stacked Bar Chart (e.g., Feature Usage per User)
const generateStackedBarData = (userCount = 5, features = ["Analysis", "Visualize", "Sharing", "Export"]) => {
  const data = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < userCount; i++) {
    let name = getRandomName();
    while (usedNames.has(name)) {
      name = getRandomName();
    }
    usedNames.add(name);

    const userData: { user: string; [key: string]: number | string } = { user: name };
    let totalUsage = 0;
    features.forEach(feature => {
      const usage = Math.floor(Math.random() * 50) + 5; // Random usage between 5 and 55
      userData[feature] = usage;
      totalUsage += usage;
    });
    // Optional: Add a total if needed, though not strictly necessary for stacking
    // userData.total = totalUsage;
    data.push(userData);
  }
  // Sort by a dominant feature or total if desired, e.g., by Analysis usage
  return data.sort((a, b) => (b.Analysis as number) - (a.Analysis as number));
};

// Generate data for Composed Chart (Monthly Activity with Trend)
const generateComposedData = (months = 12) => {
  const data = [];
  let date = new Date();
  date.setMonth(date.getMonth() - months); // Start from 'months' ago
  date.setDate(1); // Start at the beginning of the month

  const messageData: number[] = [];
  for (let i = 0; i < months; i++) {
      messageData.push(Math.floor(Math.random() * 1000) + 50); // Random messages per month
  }

  for (let i = 0; i < months; i++) {
    date.setMonth(date.getMonth() + 1);
    const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const messages = messageData[i];

    // Calculate a simple moving average for the trend (or just randomize)
    let trend = null;
    const windowSize = 3;
    if (i >= windowSize - 1) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
            sum += messageData[i - j];
        }
        trend = Math.round(sum / windowSize);
    } else {
        // Handle initial points - maybe use available data or keep null/0
        let sum = 0;
        for (let j = 0; j <= i; j++) {
            sum += messageData[j];
        }
        trend = Math.round(sum / (i + 1)); // Average of available points
    }
    // Alternative: Simple random trend for demo
    // const trend = Math.floor(Math.random() * 800) + 100;

    data.push({
      month: monthStr,
      messages: messages,
      trend: trend,
    });
  }
  return data;
};


// --- Chart Components ---

const barChartBaseConfig = { // Keep a base structure if needed
  messages: { label: "Messages" },
} satisfies ChartConfig

// Modify MessagesPerUserChart to accept chartConfig prop
function MessagesPerUserChart({ data, chartConfig }: { data: ReturnType<typeof generateBarData>, chartConfig: ChartConfig }) {
  return (
    // Use the passed chartConfig here
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="user"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        {/* This should now correctly use the color defined in the passed chartConfig */}
        <Bar dataKey="messages" fill="var(--color-messages)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const lineChartBaseConfig = { // Keep a base structure if needed
  messages: { label: "Messages" },
} satisfies ChartConfig

// Modify MessagesOverTimeChart to accept chartConfig prop
function MessagesOverTimeChart({ data, chartConfig }: { data: ReturnType<typeof generateLineData>, chartConfig: ChartConfig }) {
  return (
    // Use the passed chartConfig here
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <LineChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
         <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
         {/* This should now correctly use the color defined in the passed chartConfig */}
        <Line type="monotone" dataKey="messages" stroke="var(--color-messages)" strokeWidth={2} dot={true} />
      </LineChart>
    </ChartContainer>
  )
}

// --- Stacked Bar Chart Component ---
// Define keys based on the features in generateStackedBarData
const stackedBarChartConfig = {
  Analysis: { label: "Analysis", color: "hsl(var(--chart-1))" },
  Visualize: { label: "Visualize", color: "hsl(var(--chart-2))" },
  Sharing: { label: "Sharing", color: "hsl(var(--chart-3))" },
  Export: { label: "Export", color: "hsl(var(--chart-4))" },
  // Add more if needed, up to chart-5
} satisfies ChartConfig;

function FeatureUsageChart({ data, chartConfig }: { data: ReturnType<typeof generateStackedBarData>, chartConfig: ChartConfig }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="user"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          // Angle ticks if names are long
          // angle={-45}
          // textAnchor="end"
          // height={50} // Adjust height if ticks are angled
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />} // Default tooltip shows all stacked values
        />
        {/* Render a Bar for each key in the config, using the same stackId */}
        {Object.entries(chartConfig).map(([key, config]) => (
           <Bar
             key={key}
             dataKey={key}
             fill={`var(--color-${key})`} // Use the color variable defined in the config
             stackId="a" // All bars belong to the same stack
             radius={[0, 0, 0, 0]} // Optional: Adjust radius for stacked appearance
             // Apply top radius only to the last bar in the stack if desired
             // radius={ index === Object.keys(chartConfig).length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
           />
        ))}
        {/* Add Legend */}
        {/* <ChartLegend content={<ChartLegendContent />} /> */}
      </BarChart>
    </ChartContainer>
  );
}

// --- Composed Chart Component (Bar + Line) ---
const composedChartConfig = {
  messages: { label: "Messages", color: "hsl(var(--chart-1))" },
  trend: { label: "3-Month Trend", color: "hsl(var(--chart-2))" }, // Use a different color
} satisfies ChartConfig;

function MonthlyActivityChart({ data, chartConfig }: { data: ReturnType<typeof generateComposedData>, chartConfig: ChartConfig }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      {/* Use ComposedChart */}
      <ComposedChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          // tickFormatter={(value) => value.slice(0, 3)} // Abbreviate month if needed
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />} // Shows both values
        />
        {/* Add Legend */}
        <ChartLegend content={<ChartLegendContent />} />
        {/* Bar for messages */}
        <Bar dataKey="messages" fill="var(--color-messages)" radius={4} barSize={20} />
        {/* Line for trend */}
        <Line
            dataKey="trend"
            type="monotone"
            stroke="var(--color-trend)"
            strokeWidth={2}
            dot={false} // Hide dots on the trend line
        />
      </ComposedChart>
    </ChartContainer>
  );
}

// --- Pie Chart Component ---
// Base config structure
const pieChartBaseConfig = {
    value: { label: 'Messages' },
    Text: { label: 'Text' },
    Media: { label: 'Media' },
    Links: { label: 'Links' },
} satisfies ChartConfig

// Re-enable Pie Chart Component, accepting chartConfig
function MessageTypePieChart({ data, chartConfig }: { data: ReturnType<typeof generatePieData>, chartConfig: ChartConfig }) {
    return (
        // Use the passed chartConfig
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]" // Center horizontally, maintain aspect ratio
        >
            <PieChart accessibilityLayer>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="type" />} // Show type on tooltip
                />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="type"
                    innerRadius={60} // Make it a Donut chart
                    outerRadius={90}
                    paddingAngle={2}
                    // Fill comes from data generated by generatePieData which uses CSS vars
                />
                 {/* Optional: Add Legend */}
                 <ChartLegend content={<ChartLegendContent nameKey="type" />} className="-translate-y-2" />
            </PieChart>
        </ChartContainer>
    )
}

// --- Main Rotating Chart Component ---

const chartComponents = [
  { Component: MessagesPerUserChart, generator: generateBarData, title: "Messages per User" },
  { Component: MessagesOverTimeChart, generator: generateLineData, title: "Daily Activity" },
  { Component: FeatureUsageChart, generator: generateStackedBarData, title: "Feature Usage" },
  { Component: MonthlyActivityChart, generator: generateComposedData, title: "Monthly Activity" },
  // Add the Pie chart back
  { Component: MessageTypePieChart, generator: generatePieData, title: "Message Types" },
]

export function LandingHeroChart() {
  const [mounted, setMounted] = useState(false)
  const [activeChartIndex, setActiveChartIndex] = useState(0)
  const [currentChartData, setCurrentChartData] = useState<any>(null)
  const [chartTheme, setChartTheme] = useState<ChartTheme>("default")

  // Effect for mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Effect for initial data load
  useEffect(() => {
    if (mounted) {
      setCurrentChartData(chartComponents[0].generator())
    }
  }, [mounted])

  // Effect for interval timer - UPDATED to 5 seconds
  useEffect(() => {
    if (!mounted) return

    const intervalId = setInterval(() => {
      setActiveChartIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % chartComponents.length
        setCurrentChartData(chartComponents[nextIndex].generator())
        return nextIndex
      })
    }, 5000) // <-- Changed to 5 seconds

    return () => clearInterval(intervalId)
  }, [mounted])

  // Render placeholder if not mounted or data not ready
  if (!mounted || !currentChartData) {
    return (
      <div className="flex justify-center items-center aspect-square bg-muted/50 rounded-lg border border-border/50 shadow-sm p-8 animate-pulse">
        <div className="text-center text-muted-foreground">
          <p>Loading chart...</p>
        </div>
      </div>
    )
  }

  // --- Dynamic Config Generation ---
  const { Component, title } = chartComponents[activeChartIndex];
  const currentThemeColors = chartThemes[chartTheme]; // Get HSL strings for the selected theme

  // Create the specific config for the current chart using selected theme colors
  let dynamicConfig: ChartConfig = {};
  if (title === "Messages per User") {
      dynamicConfig = {
          messages: {
              label: "Messages",
              color: currentThemeColors['--chart-1']
          }
      };
  } else if (title === "Daily Activity") {
      dynamicConfig = {
          messages: {
              label: "Messages",
              color: currentThemeColors['--chart-1']
          }
      };
  } else if (title === "Feature Usage") {
      // Assign colors from the theme to the stacked bar config keys
      dynamicConfig = {
          Analysis: { label: "Analysis", color: currentThemeColors['--chart-1'] },
          Visualize: { label: "Visualize", color: currentThemeColors['--chart-2'] },
          Sharing: { label: "Sharing", color: currentThemeColors['--chart-3'] },
          Export: { label: "Export", color: currentThemeColors['--chart-4'] },
      };
  } else if (title === "Monthly Activity") { // <-- Add config for the new chart
      dynamicConfig = {
          messages: { label: "Messages", color: currentThemeColors['--chart-1'] },
          trend: { label: "3-Month Trend", color: currentThemeColors['--chart-2'] }, // Use chart-2 for trend line
      };
  } else if (title === "Message Types") { // <-- Add config for Pie Chart
      dynamicConfig = {
          value: { label: 'Messages' }, // Keep the value key
          Text: { label: 'Text', color: currentThemeColors['--chart-1'] },
          Media: { label: 'Media', color: currentThemeColors['--chart-2'] },
          Links: { label: 'Links', color: currentThemeColors['--chart-3'] },
      };
  }
  // Add logic here if you bring back the Pie chart, assigning colors for Text, Media, Links

  return (
    // Remove the inline style from the Card
    <Card className="shadow-lg h-full flex flex-col overflow-hidden">
      <CardHeader className="items-center pb-2 pt-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-2">
         <ResponsiveContainer width="100%" height={250}>
             {/* Pass the dynamically created config to the specific chart component */}
             <Component data={currentChartData} chartConfig={dynamicConfig} />
         </ResponsiveContainer>
      </CardContent>
       {/* Theme Selector Buttons */}
       <div className="flex justify-center gap-2 p-3 border-t bg-muted/30">
         {(Object.keys(chartThemes) as ChartTheme[]).map((themeKey) => (
           <Button
             key={themeKey}
             variant={chartTheme === themeKey ? "default" : "outline"}
             size="sm"
             onClick={() => setChartTheme(themeKey)}
             className="capitalize text-xs h-7 px-2"
           >
             {themeKey}
           </Button>
         ))}
       </div>
    </Card>
  )
} 