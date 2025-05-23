"use client"

import { useEffect, useState } from "react"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DashboardCharts } from "./components/dashboard-charts"
import { DataTable } from "./components/data-table"
import { SectionCards } from "./components/section-cards"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function Page() {
  const [analysisData, setAnalysisData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Get the analysis results from localStorage
    const storedData = localStorage.getItem("whatsappAnalysisResults")
    if (!storedData) {
      toast.error("No Analysis Data", {
        description: "Please upload and analyze a chat file first.",
      })
      router.push("/upload")
      return
    }

    try {
      const data = JSON.parse(storedData)
      setAnalysisData(data)
    } catch (error) {
      console.error("Error parsing analysis data:", error)
      toast.error("Error Loading Data", {
        description: "Could not load the analysis results.",
      })
      router.push("/upload")
    }
  }, [router])

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    )
  }

  return (
    <> 
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards data={analysisData.basicStats} />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={analysisData.timeline} />
        </div>
        <DataTable data={analysisData.userActivity.user_activity} />
        <div className="px-4 lg:px-6">
          <DashboardCharts 
            sentimentData={analysisData.sentiment}
            emojiData={analysisData.emoji}
            conversationPatterns={analysisData.conversationPatterns}
            responseTimes={analysisData.responseTimes}
            wordUsage={analysisData.wordUsage}
            messageLength={analysisData.messageLength}
            moodShifts={analysisData.moodShifts}
          />
        </div>
      </div>
    </div>
    </>
  )
}