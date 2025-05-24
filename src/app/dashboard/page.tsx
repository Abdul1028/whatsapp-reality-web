"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardCharts } from '@/app/dashboard/components/dashboard-charts';
import { AnalysisCharts } from '@/app/dashboard/components/analysis-charts';
import { RawDataTable } from '@/app/dashboard/components/raw-data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as analysisEngine from '@/lib/analysis-engine';
import type { UserStat, BasicStats as CalculatedBasicStats, TimelineActivityData } from '@/lib/analysis-engine';
import type { DataFrameRow } from '@/components/upload-form';

// Interfaces for the data structures
// Updated BasicStatsData to match what analysis-engine provides and upload-form stores
interface BasicStatsData {
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

// UserActivityData on this page now refers to the structure stored in localStorage
// which contains the user_activity array of UserStat objects.
interface StoredUserActivityData {
  user_activity: UserStat[]; 
}

// Timeline Data (remains as is for now)
interface TimelineDataPoint {
  date: string;
  messages: number;
  words: number;
}
interface TimelineData {
  monthly: TimelineDataPoint[];
  daily: TimelineDataPoint[];
}

// Word Usage Data (remains as is for now)
interface WordCount {
  word: string;
  count: number;
}
interface WordUsageData {
  total_words: number;
  word_diversity: number;
  words_per_message: number;
  word_counts: WordCount[];
}

// Sentiment Data (remains as is for now)
interface UserSentiment {
  [user: string]: [string, string]; 
}
interface SentimentData { 
  sentiments: UserSentiment;
  most_positive: string;
  most_negative: string;
}

// Emoji Data (remains as is for now)
interface EmojiUsage {
  emoji: string;
  count: number;
}
interface EmojiData {
  emoji_usage: EmojiUsage[];
}

// Time Patterns Data (remains as is for now)
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
type UserHourlyActivity = { hour: number; } & { [user: string]: number; };
type UserDailyActivity = { day_name: string; } & { [user: string]: number; };
interface TimePatternsData {
  hourly_activity: HourlyActivity[];
  daily_activity: DailyActivity[];
  monthly_activity: MonthlyActivity[];
  user_hourly: UserHourlyActivity[];
  user_daily: UserDailyActivity[];
}

// Conversation Flow Data (remains as is for now)
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


interface AnalysisResults {
  basicStats: BasicStatsData;
  timeline: TimelineData;
  timelineActivity?: TimelineActivityData;
  userActivity: StoredUserActivityData;
  wordUsage: WordUsageData;
  sentiment: SentimentData;
  emoji: EmojiData;
  timePatterns: TimePatternsData;
  conversationFlow: ConversationFlowData;
  conversationPatterns: any[]; 
  responseTimes: any[]; 
  messageLength: any[]; 
  moodShifts: any[];    
}

// Default initial values for robust loading
const initialBasicStats: BasicStatsData = {
  total_messages: 0, total_words: 0, total_users: 0,
  first_message_date: null, last_message_date: null,
  first_message_text: null, last_message_text: null,
  first_message_sender: null, last_message_sender: null,
  total_links: 0, total_media_omitted: 0,
};
const initialUserActivity: StoredUserActivityData = { user_activity: [] };
const initialTimePatternsData: TimePatternsData = { hourly_activity: [], daily_activity: [], monthly_activity: [], user_hourly: [], user_daily: [] };
const initialConversationFlowData: ConversationFlowData = { total_conversations: 0, conversation_stats: [], conversation_starters: [], conversation_enders: [] };
const initialSentimentData: SentimentData = { sentiments: {}, most_positive: "N/A", most_negative: "N/A" };
const initialWordUsageData: WordUsageData = { total_words: 0, word_diversity: 0, words_per_message: 0, word_counts: [] };
const initialEmojiData: EmojiData = { emoji_usage: [] };
const initialTimelineData: TimelineData = { monthly: [], daily: [] };
const initialTimelineActivityData: TimelineActivityData = { daily: [], monthly: [], yearly: [] };

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [rawDataFrame, setRawDataFrame] = useState<DataFrameRow[]>([]);
  const [chatFileName, setChatFileName] = useState<string>("your chat");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRawDataVisible, setIsRawDataVisible] = useState(false);

  useEffect(() => {
    const dataId = searchParams.get('id');
    const fileNameFromStorage = localStorage.getItem("whatsappChatFileName");
    if (fileNameFromStorage) setChatFileName(fileNameFromStorage);

    async function fetchDataAndProcess() {
      if (!dataId) {
        toast.error("No Analysis ID", { description: "No analysis ID found in URL. Please upload a chat file again." });
        // Attempt to load from legacy storage if no dataId, or show error message
        // This part handles the scenario where user might land here without a dataId from previous navigation
        const legacyStoredResults = localStorage.getItem("whatsappAnalysisResults");
        if (legacyStoredResults) {
            try {
                const parsedLegacy = JSON.parse(legacyStoredResults) as Partial<AnalysisResults>;
                setAnalysisResults({
                    basicStats: parsedLegacy.basicStats || initialBasicStats,
                    userActivity: parsedLegacy.userActivity || initialUserActivity,
                    timeline: parsedLegacy.timeline || initialTimelineData,
                    timelineActivity: parsedLegacy.timelineActivity || initialTimelineActivityData,
                    wordUsage: parsedLegacy.wordUsage || initialWordUsageData,
                    sentiment: parsedLegacy.sentiment || initialSentimentData,
                    emoji: parsedLegacy.emoji || initialEmojiData,
                    timePatterns: parsedLegacy.timePatterns || initialTimePatternsData,
                    conversationFlow: parsedLegacy.conversationFlow || initialConversationFlowData,
                    conversationPatterns: parsedLegacy.conversationPatterns || [],
                    responseTimes: parsedLegacy.responseTimes || [],
                    messageLength: parsedLegacy.messageLength || [],
                    moodShifts: parsedLegacy.moodShifts || [],
                });
            } catch (e) {
                setError("Failed to parse stored analysis data.");
                console.error("Error parsing legacy localStorage data:", e);
            }
        } else {
            setError("No analysis data ID found. Please upload a chat file.");
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setRawDataFrame([]);
      toast.loading("Fetching and processing analysis data...", { id: "dashboard-loading" });

      try {
        const response = await fetch(`/api/get-analysis-data?dataId=${dataId}`);
        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.error || `Failed to fetch data: ${response.status}`);
        }
        const fetchedData: DataFrameRow[] = await response.json();

        if (!fetchedData || fetchedData.length === 0) {
          throw new Error("No data received from the server or data is empty.");
        }
        
        setRawDataFrame(fetchedData);
        console.log(`[DashboardPage] Fetched ${fetchedData.length} rows for dataId: ${dataId}`);

        // Perform client-side calculations for BasicStats and UserActivity
        const calculatedBasicStats: CalculatedBasicStats = analysisEngine.calculateBasicStats(fetchedData);
        const userStats: UserStat[] = analysisEngine.calculateUserStats(fetchedData);
        const timelineActivity = analysisEngine.calculateTimelineActivity(fetchedData);

        let finalBasicStats: BasicStatsData = {
            total_messages: calculatedBasicStats.total_messages,
            total_words: calculatedBasicStats.total_words,
            total_users: calculatedBasicStats.total_users,
            first_message_date: calculatedBasicStats.first_message_date,
            last_message_date: calculatedBasicStats.last_message_date,
            first_message_text: calculatedBasicStats.first_message_text,
            last_message_text: calculatedBasicStats.last_message_text,
            first_message_sender: calculatedBasicStats.first_message_sender,
            last_message_sender: calculatedBasicStats.last_message_sender,
            total_links: calculatedBasicStats.total_links,
            total_media_omitted: calculatedBasicStats.total_media_omitted,
        };
        let finalUserActivity: StoredUserActivityData = { user_activity: userStats };

        // Load other analysis parts from localStorage (transitional)
        // These would ideally also come from server or be calculated from fetchedData if needed
        const legacyStoredResults = localStorage.getItem("whatsappAnalysisResults");
        let finalWordUsage = initialWordUsageData;
        let finalTimeline = initialTimelineData;
        let finalSentiment = initialSentimentData;
        let finalEmoji = initialEmojiData;
        let finalTimePatterns = initialTimePatternsData;
        let finalConversationFlow = initialConversationFlowData;
        let finalConvPatterns: any[] = [];
        let finalResponseTimes: any[] = [];
        let finalMsgLength: any[] = [];
        let finalMoodShifts: any[] = [];

        if (legacyStoredResults) {
            try {
                const parsedLegacy = JSON.parse(legacyStoredResults) as Partial<AnalysisResults>;
                // basicStats and userActivity are now from fetched data, don't overwrite from legacy if fetch was successful
                finalWordUsage = parsedLegacy.wordUsage || initialWordUsageData;
                finalTimeline = parsedLegacy.timeline || initialTimelineData;
                finalSentiment = parsedLegacy.sentiment || initialSentimentData;
                finalEmoji = parsedLegacy.emoji || initialEmojiData;
                finalTimePatterns = parsedLegacy.timePatterns || initialTimePatternsData;
                finalConversationFlow = parsedLegacy.conversationFlow || initialConversationFlowData;
                finalConvPatterns = parsedLegacy.conversationPatterns || [];
                finalResponseTimes = parsedLegacy.responseTimes || [];
                finalMsgLength = parsedLegacy.messageLength || [];
                finalMoodShifts = parsedLegacy.moodShifts || [];
            } catch (e) {
                 console.warn("[DashboardPage] Could not parse legacy whatsappAnalysisResults from localStorage:", e);
                 // Keep initial values for these if parsing legacy fails
            }
        }
        
        setAnalysisResults({
            basicStats: finalBasicStats,
            userActivity: finalUserActivity,
            timelineActivity: timelineActivity,
            wordUsage: finalWordUsage,
            timeline: finalTimeline,
            sentiment: finalSentiment,
            emoji: finalEmoji,
            timePatterns: finalTimePatterns,
            conversationFlow: finalConversationFlow,
            conversationPatterns: finalConvPatterns,
            responseTimes: finalResponseTimes,
            messageLength: finalMsgLength,
            moodShifts: finalMoodShifts,
        });
        toast.success("Analysis data loaded.", { id: "dashboard-loading" });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        console.error("[DashboardPage] Error fetching or processing data:", err);
        setError(errorMessage);
        toast.error("Failed to load dashboard data", { id: "dashboard-loading", description: errorMessage });
        // If fetching/processing main data fails, try to load any legacy data
        const legacyStoredResults = localStorage.getItem("whatsappAnalysisResults");
         if (legacyStoredResults) {
            try {
                const parsedLegacy = JSON.parse(legacyStoredResults) as Partial<AnalysisResults>;
                setAnalysisResults({
                    basicStats: parsedLegacy.basicStats || initialBasicStats,
                    userActivity: parsedLegacy.userActivity || initialUserActivity,
                    timeline: parsedLegacy.timeline || initialTimelineData,
                    timelineActivity: parsedLegacy.timelineActivity || initialTimelineActivityData,
                    wordUsage: parsedLegacy.wordUsage || initialWordUsageData,
                    sentiment: parsedLegacy.sentiment || initialSentimentData,
                    emoji: parsedLegacy.emoji || initialEmojiData,
                    timePatterns: parsedLegacy.timePatterns || initialTimePatternsData,
                    conversationFlow: parsedLegacy.conversationFlow || initialConversationFlowData,
                    conversationPatterns: parsedLegacy.conversationPatterns || [],
                    responseTimes: parsedLegacy.responseTimes || [],
                    messageLength: parsedLegacy.messageLength || [],
                    moodShifts: parsedLegacy.moodShifts || [],
                });
            } catch (e) { /* Do nothing if legacy parsing also fails */ }
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDataAndProcess();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  if (error && !analysisResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg mb-2 text-destructive">Error: {error}</p>
        <p className="text-sm text-muted-foreground mb-4">Could not load analysis data for "{chatFileName}".</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Upload a new chat file
        </button>
      </div>
    );
  }
  
  if (!analysisResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg mb-4">No analysis data found for "{chatFileName}". This could be due to missing ID or data.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Upload a new chat file
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-2">Chat Analysis Dashboard</h1>
      <p className="text-muted-foreground mb-6">Results for: <span className='text-primary font-semibold'>{chatFileName}</span></p>
      {error && <p className="text-destructive text-center mb-4">Note: There was an issue loading some parts of the data: {error}</p>} 

      <div className="mb-8">
        <AnalysisCharts
          wordUsageData={analysisResults.wordUsage} 
          userActivityData={analysisResults.userActivity?.user_activity} 
        />
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading charts...</p>
        </div>
      }>
        <DashboardCharts
          basicStats={analysisResults.basicStats}
          userActivity={analysisResults.userActivity?.user_activity}
          sentimentData={analysisResults.sentiment}
          emojiData={analysisResults.emoji}
          wordUsage={analysisResults.wordUsage?.word_counts}
          timePatternsData={analysisResults.timePatterns}
          conversationFlowData={analysisResults.conversationFlow}
          timelineActivityData={analysisResults.timelineActivity}
          messageLength={analysisResults.messageLength}
          moodShifts={analysisResults.moodShifts}
          conversationPatterns={analysisResults.conversationPatterns}
          responseTimes={analysisResults.responseTimes}
        />
      </Suspense>

      {/* Raw Data Table Section (Collapsible) */}
      {rawDataFrame.length > 0 && (
        <Collapsible
            open={isRawDataVisible}
            onOpenChange={setIsRawDataVisible}
            className="mt-8"
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle>Raw Parsed Data ({rawDataFrame.length} rows)</CardTitle>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            {isRawDataVisible ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="sr-only">Toggle raw data table</span>
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        <RawDataTable data={rawDataFrame} />
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
      )}
    </div>
  );
}