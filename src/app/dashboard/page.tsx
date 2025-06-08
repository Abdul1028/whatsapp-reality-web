"use client";

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardCharts } from '@/app/dashboard/components/dashboard-charts';
import { RawDataTable } from '@/app/dashboard/components/raw-data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as analysisEngine from '@/lib/analysis-engine';
import type { 
    UserStat, 
    BasicStats as CalculatedBasicStats, 
    TimelineActivityData, 
    WordUsageData as EngineWordUsageData, 
    EmojiData as EngineEmojiData,
    TimePatternsData as EngineTimePatternsData,
    HourlyActivityPoint as EngineHourlyActivityPoint,
    DailyActivityPoint as EngineDailyActivityPoint,
    MonthlyActivityPoint as EngineMonthlyActivityPoint,
    UserReplyTimeStat,
    MessageTypeCounts,
    SharedLinksData
} from '@/lib/analysis-engine';
import type { DataFrameRow } from '@/components/upload-form';
import ChatPerspectiveView from './components/ChatPerspectiveView';

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

// Word Usage Data (should align with analysisEngine.WordUsageData)
interface WordCount { // This is identical to analysisEngine.WordCount
  word: string;
  count: number;
}
interface WordUsageData { // This should now be identical to analysisEngine.WordUsageData
  total_words: number;
  word_diversity: number;
  words_per_message: number;
  word_counts: WordCount[];
  // stop_words_used?: string[]; // Optional: could add this if we want to use/display it
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

// Time Patterns Data - Old definitions will be replaced or aligned with EngineTimePatternsData
// interface HourlyActivity { ... }
// interface DailyActivity { ... }
// interface MonthlyActivity { ... }
// type UserHourlyActivity = { ... };
// type UserDailyActivity = { ... };
// interface TimePatternsData { ... } // This will now come from analysis-engine

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
  timeline: TimelineData; // Old timeline, distinct from TimelineActivityData
  timelineActivity?: TimelineActivityData; // From analysis-engine
  userActivity: StoredUserActivityData;
  wordUsage: WordUsageData; // From analysis-engine (via EngineWordUsageData)
  sentiment: SentimentData; // Legacy
  emoji: EngineEmojiData; // From analysis-engine (via EngineEmojiData)
  timePatterns: EngineTimePatternsData; // Now from analysis-engine
  replyTimeStats?: UserReplyTimeStat[]; // Add new field for reply time stats
  conversationFlow: ConversationFlowData; // Legacy
  conversationPatterns: any[]; 
  responseTimes: any[]; 
  messageLength: any[]; 
  moodShifts: any[];    
  userComparisonTimelineData?: analysisEngine.UserComparisonTimelineData;
  messageTypeCounts?: MessageTypeCounts;
  sharedLinks?: SharedLinksData;
  userMessageTypeBreakdown?: analysisEngine.UserMessageTypeBreakdown[];
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

// Update initialTimePatternsData to match EngineTimePatternsData structure
const initialTimePatternsData: EngineTimePatternsData = {
  hourly_activity: Array(24).fill(null).map((_, i) => ({ hour: i, message_count: 0 })),
  daily_activity: [
    { day_name: "Sunday", day_numeric: 0, message_count: 0 },
    { day_name: "Monday", day_numeric: 1, message_count: 0 },
    { day_name: "Tuesday", day_numeric: 2, message_count: 0 },
    { day_name: "Wednesday", day_numeric: 3, message_count: 0 },
    { day_name: "Thursday", day_numeric: 4, message_count: 0 },
    { day_name: "Friday", day_numeric: 5, message_count: 0 },
    { day_name: "Saturday", day_numeric: 6, message_count: 0 },
  ],
  monthly_activity: [],
};

const initialConversationFlowData: ConversationFlowData = { total_conversations: 0, conversation_stats: [], conversation_starters: [], conversation_enders: [] };
const initialSentimentData: SentimentData = { sentiments: {}, most_positive: "N/A", most_negative: "N/A" };
const initialWordUsageData: WordUsageData = { total_words: 0, word_diversity: 0, words_per_message: 0, word_counts: [] };
const initialEmojiData: EngineEmojiData = { emoji_usage: [] };
const initialTimelineData: TimelineData = { monthly: [], daily: [] };
const initialTimelineActivityData: TimelineActivityData = { daily: [], monthly: [], yearly: [] , weekly: []};
const initialReplyTimeStats: UserReplyTimeStat[] = []; // Initial state for reply time stats
const initialUserComparisonTimelineData: analysisEngine.UserComparisonTimelineData = { weekly: [], monthly: [], yearly: [] };
const initialAnalysisMessageTypeCounts: MessageTypeCounts = {
  sticker: 0,
  image: 0,
  video: 0,
  document: 0,
  audio: 0,
  media: 0,
};
const initialAnalysisSharedLinks: SharedLinksData = { links: [] };
export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [rawDataFrame, setRawDataFrame] = useState<DataFrameRow[]>([]);
  const [chatFileName, setChatFileName] = useState<string>("your chat");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRawDataVisible, setIsRawDataVisible] = useState(false);
  const [stopWordsList, setStopWordsList] = useState<Set<string>>(new Set());
  const [messageTypeCounts, setMessageTypeCounts] = useState<MessageTypeCounts>(initialAnalysisMessageTypeCounts);
  const [showFeatureInfo, setShowFeatureInfo] = useState(false);
  const chatPerspectiveRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    // Fetch stop words
    async function fetchStopWords() {
      try {
        const response = await fetch('/stop_words.txt');
        if (!response.ok) {
          console.error('Failed to fetch stop_words.txt', response.statusText);
          // Proceed with an empty list or default if fetching fails
          // Alternatively, set an error state or use a hardcoded fallback
          return;
        }
        const text = await response.text();
        const wordsArray = text.split('\n').map(word => word.trim().toLowerCase()).filter(word => word.length > 0);
        setStopWordsList(new Set(wordsArray));
        console.log(`[DashboardPage] Loaded ${wordsArray.length} stop words into a Set.`);
      } catch (e) {
        console.error("Error fetching or processing stop words:", e);
        // Proceed with an empty list or default if fetching fails
      }
    }
    fetchStopWords();
  }, []);

  useEffect(() => {
    const dataId = searchParams.get('id');
    const fileNameFromStorage = localStorage.getItem("whatsappChatFileName");
    if (fileNameFromStorage) setChatFileName(fileNameFromStorage);

    async function fetchDataAndProcess() {
      if (!dataId) {
        toast.error("No Analysis ID", { description: "No analysis ID found in URL. Please upload a chat file again." });
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
                    replyTimeStats: parsedLegacy.replyTimeStats || initialReplyTimeStats,
                    userComparisonTimelineData: parsedLegacy.userComparisonTimelineData || initialUserComparisonTimelineData,
                    conversationFlow: parsedLegacy.conversationFlow || initialConversationFlowData,
                    conversationPatterns: parsedLegacy.conversationPatterns || [],
                    responseTimes: parsedLegacy.responseTimes || [],
                    messageLength: parsedLegacy.messageLength || [],
                    moodShifts: parsedLegacy.moodShifts || [],
                    messageTypeCounts: parsedLegacy.messageTypeCounts || initialAnalysisMessageTypeCounts,
                    sharedLinks: parsedLegacy.sharedLinks || initialAnalysisSharedLinks,
                    userMessageTypeBreakdown: parsedLegacy.userMessageTypeBreakdown || [],
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

      if (stopWordsList.size === 0) {
        console.warn("[DashboardPage] Proceeding with data processing, stop words list might be empty or still loading.");
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

        // Perform client-side calculations
        const calculatedBasicStats: CalculatedBasicStats = analysisEngine.calculateBasicStats(fetchedData);
        const userStats: UserStat[] = analysisEngine.calculateUserStats(fetchedData);
        const timelineActivity = analysisEngine.calculateTimelineActivity(fetchedData);
        const calculatedWordUsage: EngineWordUsageData = analysisEngine.calculateWordUsage(fetchedData, stopWordsList);
        const calculatedEmojiUsage: EngineEmojiData = analysisEngine.calculateEmojiUsage(fetchedData);
        const calculatedTimePatterns: EngineTimePatternsData = analysisEngine.calculateTimePatterns(fetchedData);
        const calculatedReplyTimes: UserReplyTimeStat[] = analysisEngine.calculateReplyTimes(fetchedData); // Calculate reply times
        const userComparisonTimeline = analysisEngine.calculateUserActivityTimeline(fetchedData); // <--- ADD THIS CALL
        const calculatedMessageTypeCounts: MessageTypeCounts = analysisEngine.calculateMessageTypeCounts(fetchedData);
        const calculatedSharedLinks = analysisEngine.extractSharedLinks(fetchedData);
        const calculatedConversationFlow = analysisEngine.calculateConversationFlow(fetchedData);
        const calculatedUserMessageTypeBreakdown = analysisEngine.calculateUserMessageTypeBreakdown(fetchedData);

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
        let finalWordUsage: WordUsageData = calculatedWordUsage; // WordUsageData is compatible with EngineWordUsageData
        let finalEmoji: EngineEmojiData = calculatedEmojiUsage;
        let finalTimePatterns: EngineTimePatternsData = calculatedTimePatterns; // Use newly calculated time patterns
        let finalReplyTimeStats: UserReplyTimeStat[] = calculatedReplyTimes; // Store calculated reply times
        let finalUserComparisonTimeline = userComparisonTimeline; // <--- STORE THE RESULT

        // Load OTHER analysis parts from localStorage (transitional)
        const legacyStoredResults = localStorage.getItem("whatsappAnalysisResults");
        let finalTimeline = initialTimelineData; // Old timeline data
        let finalSentiment = initialSentimentData;
        let finalConversationFlow = initialConversationFlowData;
        let finalConvPatterns: any[] = [];
        let finalResponseTimes: any[] = [];
        let finalMsgLength: any[] = [];
        let finalMoodShifts: any[] = [];

        if (legacyStoredResults) {
            try {
                const parsedLegacy = JSON.parse(legacyStoredResults) as Partial<AnalysisResults>;
                // finalWordUsage, finalEmoji are already set
                // Logic for merging/prioritizing with legacy if needed for these two
                if ((!finalWordUsage.word_counts || finalWordUsage.word_counts.length === 0) && parsedLegacy.wordUsage) {
                  finalWordUsage = parsedLegacy.wordUsage;
                }
                if ((!finalEmoji.emoji_usage || finalEmoji.emoji_usage.length === 0) && parsedLegacy.emoji) {
                  finalEmoji = parsedLegacy.emoji;
                }

                finalTimeline = parsedLegacy.timeline || initialTimelineData;
                finalSentiment = parsedLegacy.sentiment || initialSentimentData;
                finalConversationFlow = parsedLegacy.conversationFlow || initialConversationFlowData;
                finalConvPatterns = parsedLegacy.conversationPatterns || [];
                finalResponseTimes = parsedLegacy.responseTimes || [];
                finalMsgLength = parsedLegacy.messageLength || [];
                finalMoodShifts = parsedLegacy.moodShifts || [];
                // Prioritize fresh calculations for replyTimeStats
                if (!finalReplyTimeStats || finalReplyTimeStats.length === 0) {
                  finalReplyTimeStats = parsedLegacy.replyTimeStats || initialReplyTimeStats;
                }
            } catch (e) {
                 console.warn("[DashboardPage] Could not parse legacy whatsappAnalysisResults from localStorage:", e);
            }
        }
        
        
        setMessageTypeCounts(calculatedMessageTypeCounts);
        setAnalysisResults({
            basicStats: finalBasicStats,
            userActivity: finalUserActivity,
            timelineActivity: timelineActivity, // New timeline activity from engine
            wordUsage: finalWordUsage,
            timeline: finalTimeline, // Legacy timeline data
            sentiment: finalSentiment,
            emoji: finalEmoji,
            timePatterns: finalTimePatterns, // Newly calculated time patterns
            replyTimeStats: finalReplyTimeStats, // Pass replyTimeStats to results
            conversationFlow: calculatedConversationFlow,
            conversationPatterns: finalConvPatterns,
            responseTimes: finalResponseTimes,
            messageLength: finalMsgLength,
            moodShifts: finalMoodShifts,
            userComparisonTimelineData: finalUserComparisonTimeline, // <--- USE THE CALCULATED DATA HERE
            messageTypeCounts: calculatedMessageTypeCounts,
            sharedLinks: calculatedSharedLinks,
            userMessageTypeBreakdown: calculatedUserMessageTypeBreakdown,
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
                    replyTimeStats: parsedLegacy.replyTimeStats || initialReplyTimeStats,
                    userComparisonTimelineData: parsedLegacy.userComparisonTimelineData || initialUserComparisonTimelineData,
                    conversationFlow: parsedLegacy.conversationFlow || initialConversationFlowData,
                    conversationPatterns: parsedLegacy.conversationPatterns || [],
                    responseTimes: parsedLegacy.responseTimes || [],
                    messageLength: parsedLegacy.messageLength || [],
                    moodShifts: parsedLegacy.moodShifts || [],
                    messageTypeCounts: parsedLegacy.messageTypeCounts || initialAnalysisMessageTypeCounts,
                    sharedLinks: parsedLegacy.sharedLinks || initialAnalysisSharedLinks, // <-- FIXED
                    userMessageTypeBreakdown: parsedLegacy.userMessageTypeBreakdown || [],
                });
            } catch (e) { /* Do nothing if legacy parsing also fails */ }
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDataAndProcess();

  }, [searchParams, stopWordsList, router]);

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
          replyTimeStats={analysisResults.replyTimeStats}
          userComparisonTimelineData={analysisResults.userComparisonTimelineData}
          messageTypeCounts={analysisResults.messageTypeCounts || messageTypeCounts}
          sharedLinks={analysisResults.sharedLinks}
          userMessageTypeBreakdown={analysisResults.userMessageTypeBreakdown}
          onGoToChatPerspective={() => chatPerspectiveRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />
      </Suspense>

            {/* Chat Conversation Explorer Section */}
            {rawDataFrame.length > 0 && Array.from(new Set(rawDataFrame.map(m => m.user))).length > 1 && (
        <div ref={chatPerspectiveRef} className="my-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold">View Chats in WhatsApp Web Format</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeatureInfo(v => !v)}
              aria-expanded={showFeatureInfo}
              className="ml-2"
            >
              What does this do?
            </Button>
          </div>
          {showFeatureInfo && (
            <div className="bg-muted/40 rounded p-3 text-sm mb-2">
              <ul className="list-disc pl-5">
                <li><b>Show participants:</b> Select one or more users to filter the chat to just their messages.</li>
                <li><b>View with perspective of:</b> See the chat as if you were any participant—your messages appear on the right, others on the left, just like WhatsApp Web.</li>
                <li><b>WhatsApp Web format:</b> Messages are displayed in a familiar, chat-like style for easy reading and context.</li>
              </ul>
            </div>
          )}
          <ChatPerspectiveView 
            messages={rawDataFrame}
            users={Array.from(new Set(rawDataFrame.filter(m => m.user !== 'group_notification').map(m => m.user)))}
          />
        </div>
      )}


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