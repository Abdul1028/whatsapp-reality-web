import { DataFrameRow } from '@/components/upload-form';

// Define a more specific type for BasicStats
export interface BasicStats {
  total_messages: number;
  total_words: number;
  total_users: number;
  first_message_date: string | null; // ISO string or null
  last_message_date: string | null; // ISO string or null
  first_message_text: string | null;
  last_message_text: string | null;
  first_message_sender: string | null;
  last_message_sender: string | null;
  total_links: number;
  total_media_omitted: number; 
}

export interface UserStat {
  user: string;
  message_count: number;
  word_count: number;
  avg_message_length: number;
  links_shared_count: number;
  media_shared_count: number;
  voice_notes_sent: number; // Added for voice notes
  biggest_message?: { text: string; length: number };
  most_used_emojis: { emoji: string; count: number }[]; // Added for top emojis per user
  longest_daily_streak: { // Added for daily streak
    start_date: string | null;
    end_date: string | null;
    length_days: number;
  };
}

const MEDIA_OMITTED_KEYWORDS = [
  '<Media omitted>', 'image omitted', 'video omitted', 
  'GIF omitted', 'sticker omitted', 'audio omitted', 'document omitted'
];
const SPECIFIC_AUDIO_OMITTED_KEYWORD = "audio omitted"; // More specific for voice notes if possible
const LINK_REGEX = /(?:https?:\/\/|www\.)[^\s\/$.?#].[^\s]*/gi;
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

export function calculateBasicStats(data: DataFrameRow[]): BasicStats {
  if (!data || data.length === 0) {
    return {
      total_messages: 0,
      total_words: 0,
      total_users: 0,
      first_message_date: null,
      last_message_date: null,
      first_message_text: null,
      last_message_text: null,
      first_message_sender: null, 
      last_message_sender: null,
      total_links: 0,
      total_media_omitted: 0,
    };
  }

  let totalWords = 0;
  let totalLinks = 0;
  let totalMediaOmitted = 0;
  const uniqueUserSet = new Set<string>();

  data.forEach(row => {
    totalWords += row['Message Length'];
    if (row.user !== 'group_notification') {
      uniqueUserSet.add(row.user);
    }

    // Count links
    const linksInMessage = row.message.match(LINK_REGEX);
    if (linksInMessage) {
      totalLinks += linksInMessage.length;
    }

    // Count media omitted
    if (MEDIA_OMITTED_KEYWORDS.some(keyword => row.message.includes(keyword))) {
      totalMediaOmitted++;
    }
  });

  const encryptionNotificationMessage = "Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.";
  let firstActualMessageIndex = 0;
  while (
    firstActualMessageIndex < data.length &&
    data[firstActualMessageIndex].message === encryptionNotificationMessage
  ) {
    firstActualMessageIndex++;
  }

  const firstMessageEntry = firstActualMessageIndex < data.length ? data[firstActualMessageIndex] : data[0];
  // If all messages were the notification, firstMessageEntry will be data[0] (or data[data.length] if handled differently, but data[0] is safer if loop finishes)
  // However, if firstActualMessageIndex >= data.length, it means all messages were notifications, or data was empty (already handled)
  // A more robust way for empty or all-notification case:

  let f_message_date: string | null = null;
  let f_message_text: string | null = null;
  let f_message_sender: string | null = null;

  if (firstActualMessageIndex < data.length) {
    // We found an actual first message
    f_message_date = new Date(data[firstActualMessageIndex].date).toISOString();
    f_message_text = data[firstActualMessageIndex].message;
    f_message_sender = data[firstActualMessageIndex].user;
  } else if (data.length > 0) {
    // All messages were notifications, or some other edge case. Fallback to the very first message.
    // Or, if desired, set to null if all were notifications. For now, let's use the original first one.
    // This case might indicate an issue if ONLY notifications exist, but the current structure implies data[0] exists.
    f_message_date = new Date(data[0].date).toISOString();
    f_message_text = data[0].message;
    f_message_sender = data[0].user;
  }

  return {
    total_messages: data.length,
    total_words: totalWords,
    total_users: uniqueUserSet.size,
    first_message_date: f_message_date,
    last_message_date: new Date(data[data.length - 1].date).toISOString(),
    first_message_text: f_message_text,
    last_message_text: data[data.length - 1].message,
    first_message_sender: f_message_sender,
    last_message_sender: data[data.length - 1].user,
    total_links: totalLinks,
    total_media_omitted: totalMediaOmitted,
  };
}

export function calculateUserStats(data: DataFrameRow[]): UserStat[] {
  if (!data || data.length === 0) return [];

  const userStatsMap = new Map<string, UserStat>();
  // First, populate the map with initial UserStat objects and collect all message dates per user
  const userMessageDates = new Map<string, string[]>();

  data.forEach(row => {
    if (row.user === 'group_notification') return; 

    let userStat = userStatsMap.get(row.user);
    if (!userStat) {
      userStat = {
        user: row.user,
        message_count: 0,
        word_count: 0,
        avg_message_length: 0,
        links_shared_count: 0,
        media_shared_count: 0,
        voice_notes_sent: 0, 
        biggest_message: { text: 'N/A', length: 0 },
        most_used_emojis: [],
        longest_daily_streak: { start_date: null, end_date: null, length_days: 0 }, // Initialize
      };
      userStatsMap.set(row.user, userStat);
      userMessageDates.set(row.user, []);
      (userStat as any)._emojiCounts = new Map<string, number>(); 
    }

    // Collect date for streak calculation (YYYY-MM-DD format)
    try {
      const d = new Date(row.date);
      if (!isNaN(d.getTime())) {
        const dateString = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
        userMessageDates.get(row.user)?.push(dateString);
      }
    } catch (e) {
      console.warn(`Error parsing date for streak calculation: ${row.date}`, e);
    }
    
    userStat.message_count++;
    userStat.word_count += row['Message Length'];

    const linksInMessage = row.message.match(LINK_REGEX);
    if (linksInMessage) {
      userStat.links_shared_count += linksInMessage.length;
    }
    if (MEDIA_OMITTED_KEYWORDS.some(keyword => row.message.includes(keyword))) {
      userStat.media_shared_count++;
    }
    if (row.message.includes(SPECIFIC_AUDIO_OMITTED_KEYWORD)) {
      userStat.voice_notes_sent++;
    }
    const emojisInMessage = row.message.match(EMOJI_REGEX);
    if (emojisInMessage) {
      const emojiCounts = (userStat as any)._emojiCounts as Map<string, number>; 
      emojisInMessage.forEach(emoji => {
        emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1);
      });
    }
    if (row['Message Length'] > (userStat.biggest_message?.length || 0)) {
      userStat.biggest_message = {
        text: row.message,
        length: row['Message Length'],
      };
    }
  });

  // Second pass: calculate averages, top emojis, and longest streaks
  const finalStats: UserStat[] = [];
  for (const [userName, stat] of userStatsMap.entries()) {
    // Calculate Longest Daily Streak
    const dates = userMessageDates.get(userName);
    if (dates && dates.length > 0) {
      const uniqueSortedDates = Array.from(new Set(dates)).sort();
      
      if (uniqueSortedDates.length > 0) {
        let maxStreak = { start: uniqueSortedDates[0], end: uniqueSortedDates[0], length: 1 };
        let currentStreak = { start: uniqueSortedDates[0], length: 1 };

        for (let i = 1; i < uniqueSortedDates.length; i++) {
            const currentDateObj = new Date(uniqueSortedDates[i]);
            const previousDateObj = new Date(uniqueSortedDates[i-1]);
            
            const diffTime = currentDateObj.getTime() - previousDateObj.getTime();
            const diffDays = Math.round(diffTime / (1000 * 3600 * 24)); // Use Math.round for safety with DST etc.

            if (diffDays === 1) { // Consecutive days
                currentStreak.length++;
            } else { // Streak broken or non-consecutive
                if (currentStreak.length > maxStreak.length) {
                    maxStreak.length = currentStreak.length;
                    maxStreak.start = currentStreak.start;
                    maxStreak.end = uniqueSortedDates[i-1]; 
                }
                currentStreak.start = uniqueSortedDates[i];
                currentStreak.length = 1;
            }
        }
        // Check the last streak after the loop concludes
        if (currentStreak.length > maxStreak.length) {
            maxStreak.length = currentStreak.length;
            maxStreak.start = currentStreak.start;
            maxStreak.end = uniqueSortedDates[uniqueSortedDates.length - 1];
        }
        stat.longest_daily_streak = {
          start_date: maxStreak.start,
          end_date: maxStreak.end,
          length_days: maxStreak.length,
        };
      } else {
         stat.longest_daily_streak = { start_date: null, end_date: null, length_days: 0 };
      }
    } else {
      stat.longest_daily_streak = { start_date: null, end_date: null, length_days: 0 };
    }

    // Calculate Emojis
    const emojiCountsMap = (stat as any)._emojiCounts as Map<string, number>; 
    let sortedEmojis: { emoji: string; count: number }[] = [];
    if (emojiCountsMap) {
      sortedEmojis = Array.from(emojiCountsMap.entries())
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); 
    }
    delete (stat as any)._emojiCounts;

    finalStats.push({
      ...stat,
      avg_message_length: stat.message_count > 0 ? stat.word_count / stat.message_count : 0,
      most_used_emojis: sortedEmojis,
      // longest_daily_streak is already set on 'stat'
    });
  }

  return finalStats;
}

// Interfaces for Timeline Activity
export interface ActivityPoint {
  time_unit: string; // Format: YYYY-MM-DD for daily, YYYY-Www for weekly, YYYY-MM for monthly, YYYY for yearly
  message_count: number;
}

export interface TimelineActivityData {
  daily: ActivityPoint[];
  weekly: ActivityPoint[]; // Added weekly
  monthly: ActivityPoint[];
  yearly: ActivityPoint[];
}

// Helper function to get ISO week number and year for a date (copied from later in the file for use here)
function getISOWeekAndYearForTimeline(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Get day number, handling Sunday as 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNum, year: d.getUTCFullYear() };
}

export function calculateTimelineActivity(data: DataFrameRow[]): TimelineActivityData {
  console.log("[calculateTimelineActivity] Received data length:", data?.length);

  const dailyActivity = new Map<string, number>();
  const weeklyActivity = new Map<string, number>(); // Added for weekly
  const monthlyActivity = new Map<string, number>();
  const yearlyActivity = new Map<string, number>();

  if (!data || data.length === 0) {
    return { daily: [], weekly: [], monthly: [], yearly: [] }; // Added weekly default
  }

  data.forEach((row, index) => {
    const date = new Date(row.date);
    
    if (index < 3) { 
      console.log(`[calculateTimelineActivity] Processing row ${index}: date=${row.date}, parsedDate=${date.toISOString()}`);
    }

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date encountered for row: ${JSON.stringify(row)}`);
      return; 
    }

    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const day = date.getDate().toString().padStart(2, '0');

    const dailyKey = `${year}-${month}-${day}`;
    const monthlyKey = `${year}-${month}`;
    const yearlyKey = year;

    // Weekly Key Calculation
    const { week: weekNum, year: weekYear } = getISOWeekAndYearForTimeline(date);
    const weeklyKey = `${weekYear}-W${weekNum.toString().padStart(2, '0')}`;

    dailyActivity.set(dailyKey, (dailyActivity.get(dailyKey) || 0) + 1);
    weeklyActivity.set(weeklyKey, (weeklyActivity.get(weeklyKey) || 0) + 1); // Aggregate weekly
    monthlyActivity.set(monthlyKey, (monthlyActivity.get(monthlyKey) || 0) + 1);
    yearlyActivity.set(yearlyKey, (yearlyActivity.get(yearlyKey) || 0) + 1);
  });

  const formatMapToActivityPoints = (activityMap: Map<string, number>): ActivityPoint[] => {
    return Array.from(activityMap.entries())
      .map(([time_unit, message_count]) => ({ time_unit, message_count }))
      .sort((a, b) => a.time_unit.localeCompare(b.time_unit)); 
  };

  const result = {
    daily: formatMapToActivityPoints(dailyActivity),
    weekly: formatMapToActivityPoints(weeklyActivity), // Add weekly to result
    monthly: formatMapToActivityPoints(monthlyActivity),
    yearly: formatMapToActivityPoints(yearlyActivity),
  };
  console.log("[calculateTimelineActivity] Returning result (with weekly):", JSON.stringify(result, null, 2));
  return result;
}

// Placeholder for future, more complex emoji analysis
// export function calculateMostUsedEmojisPerUser(data: DataFrameRow[]) { ... }     

// Interfaces for Word Usage Analysis
export interface WordCount {
  word: string;
  count: number;
}

export interface WordUsageData {
  total_words: number; // Total number of words (after stopword removal if applied)
  word_diversity: number; // Number of unique words (renamed from unique_words)
  words_per_message: number; // Average words per message
  word_counts: WordCount[]; // Sorted list of words and their counts
  stop_words_used?: string[]; // Optional: list of stopwords for reference
}

export function calculateWordUsage(data: DataFrameRow[], stopWords: Set<string>, topN: number = 100): WordUsageData {
  const wordFrequency = new Map<string, number>();
  let totalWordsAfterCleaning = 0;
  let totalMessagesWithText = 0;

  if (!data || data.length === 0) {
    return {
      total_words: 0,
      word_diversity: 0,
      words_per_message: 0,
      word_counts: [],
    };
  }

  data.forEach(row => {
    if (row.user === 'group_notification' || MEDIA_OMITTED_KEYWORDS.some(keyword => row.message.includes(keyword))) {
      return; // Skip notifications and media messages for word count
    }

    // Remove URLs before splitting into words
    const messageText = row.message.replace(LINK_REGEX, '');
    // Normalize text: lowercase, remove punctuation (basic), then split into words
    // Regex: split by non-alphanumeric characters (keeps letters and numbers together)
    const words = messageText.toLowerCase().split(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]+/);
    // \u00C0-\u024F are Latin Extended-A and B, \u1E00-\u1EFF are Latin Extended Additional
    // This helps preserve accented characters and other common international characters as part of words.

    let messageHasWords = false;
    words.forEach(word => {
      if (word && word.length > 1 && !stopWords.has(word) && !/^\d+$/.test(word)) { // Use Set.has() for stopwords
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
        totalWordsAfterCleaning++;
        messageHasWords = true;
      }
    });
    if(messageHasWords) totalMessagesWithText++;
  });

  const sortedWordCounts = Array.from(wordFrequency.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN); // Return top N words

  return {
    total_words: totalWordsAfterCleaning,
    word_diversity: wordFrequency.size,
    words_per_message: totalMessagesWithText > 0 ? totalWordsAfterCleaning / totalMessagesWithText : 0,
    word_counts: sortedWordCounts,
    stop_words_used: Array.from(stopWords), // Populate from passed argument, convert Set to Array
  };
}     

// Interfaces for Emoji Analysis (consistent with page.tsx and dashboard-charts.tsx)
export interface EmojiUsage {
  emoji: string;
  count: number;
}

export interface EmojiData {
  emoji_usage: EmojiUsage[];
}

export function calculateEmojiUsage(data: DataFrameRow[]): EmojiData {
  const emojiFrequency = new Map<string, number>();

  if (!data || data.length === 0) {
    return { emoji_usage: [] };
  }

  data.forEach(row => {
    // Skip group notifications for emoji analysis, or any other message types if desired
    if (row.user === 'group_notification') {
      return; 
    }

    const emojisInMessage = row.message.match(EMOJI_REGEX);
    if (emojisInMessage) {
      emojisInMessage.forEach(emoji => {
        // Normalize or clean emoji if necessary (e.g., remove variation selectors if they cause distinct counts for same visual emoji)
        // For now, we count as is.
        emojiFrequency.set(emoji, (emojiFrequency.get(emoji) || 0) + 1);
      });
    }
  });

  const sortedEmojiUsage = Array.from(emojiFrequency.entries())
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);

  return {
    emoji_usage: sortedEmojiUsage,
  };
}     

// Interfaces for Time Patterns Analysis
export interface HourlyActivityPoint {
  hour: number; // 0-23
  message_count: number;
}

export interface DailyActivityPoint {
  day_name: string; // e.g., "Monday", "Tuesday"
  day_numeric: number; // 0 (Sunday) - 6 (Saturday) for sorting
  message_count: number;
}

export interface MonthlyActivityPoint {
  month: string; // e.g., "January", "February"
  month_numeric: number; // 1-12 for sorting
  year: number;
  time_unit: string; // YYYY-MM for easier grouping/sorting if needed
  message_count: number;
}

export interface TimePatternsData {
  hourly_activity: HourlyActivityPoint[];
  daily_activity: DailyActivityPoint[];
  monthly_activity: MonthlyActivityPoint[];
  // user_hourly and user_daily can be added later if needed
}

export function calculateTimePatterns(data: DataFrameRow[]): TimePatternsData {
  const hourly = new Array(24).fill(0).map((_, i) => ({ hour: i, message_count: 0 }));
  const daily = [
    { day_name: "Sunday", day_numeric: 0, message_count: 0 },
    { day_name: "Monday", day_numeric: 1, message_count: 0 },
    { day_name: "Tuesday", day_numeric: 2, message_count: 0 },
    { day_name: "Wednesday", day_numeric: 3, message_count: 0 },
    { day_name: "Thursday", day_numeric: 4, message_count: 0 },
    { day_name: "Friday", day_numeric: 5, message_count: 0 },
    { day_name: "Saturday", day_numeric: 6, message_count: 0 },
  ];
  const monthlyMap = new Map<string, { month: string; month_numeric: number; year: number; time_unit: string; message_count: number }>();

  if (!data || data.length === 0) {
    return {
      hourly_activity: hourly,
      daily_activity: daily,
      monthly_activity: [],
    };
  }

  data.forEach(row => {
    const date = new Date(row.date);
    if (isNaN(date.getTime())) return; // Skip invalid dates

    // Hourly
    const hour = date.getHours();
    hourly[hour].message_count++;

    // Daily
    const dayOfWeek = date.getDay(); // 0 (Sunday) - 6 (Saturday)
    daily[dayOfWeek].message_count++;

    // Monthly
    const year = date.getFullYear();
    const monthIndex = date.getMonth(); // 0-11
    const monthName = date.toLocaleString('default', { month: 'long' });
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`; // YYYY-MM

    let monthStat = monthlyMap.get(monthKey);
    if (!monthStat) {
      monthStat = {
        month: monthName,
        month_numeric: monthIndex + 1,
        year: year,
        time_unit: monthKey,
        message_count: 0,
      };
    }
    monthStat.message_count++;
    monthlyMap.set(monthKey, monthStat);
  });

  const sortedMonthlyActivity = Array.from(monthlyMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month_numeric - b.month_numeric;
  });

  return {
    hourly_activity: hourly,
    daily_activity: daily, // Already sorted by day_numeric implicit in array order
    monthly_activity: sortedMonthlyActivity,
  };
}     

// Interfaces for Reply Time Analysis
export interface UserReplyTimeStat {
  user: string;
  total_reply_time_seconds: number;
  reply_count: number;
  average_reply_time_seconds: number | null; // null if reply_count is 0
}

export function calculateReplyTimes(data: DataFrameRow[]): UserReplyTimeStat[] {
  if (!data || data.length < 2) return [];

  const userReplyAggregates = new Map<string, { total_reply_time_seconds: number; reply_count: number }>();

  for (let i = 1; i < data.length; i++) {
    const prevMessage = data[i-1];
    const currentMessage = data[i];

    // Ensure messages are from different users and neither is a group notification
    if (currentMessage.user !== prevMessage.user && 
        currentMessage.user !== 'group_notification' && 
        prevMessage.user !== 'group_notification') {

      const prevDate = new Date(prevMessage.date);
      const currentDate = new Date(currentMessage.date);

      if (isNaN(prevDate.getTime()) || isNaN(currentDate.getTime())) {
        console.warn(`[calculateReplyTimes] Invalid date encountered: ${prevMessage.date} or ${currentMessage.date}`);
        continue;
      }

      const diffSeconds = (currentDate.getTime() - prevDate.getTime()) / 1000;

      // Only consider non-negative time differences for replies
      if (diffSeconds < 0) {
        console.warn(`[calculateReplyTimes] Negative time difference encountered, skipping: prev=${prevMessage.date}, curr=${currentMessage.date}, diff=${diffSeconds}s`);
        continue;
      }

      // Optional: Add a threshold for max reply time if desired (e.g., ignore replies over 24 hours)
      // if (diffSeconds > 24 * 60 * 60) continue;

      const userStats = userReplyAggregates.get(currentMessage.user) || { total_reply_time_seconds: 0, reply_count: 0 };
      userStats.total_reply_time_seconds += diffSeconds;
      userStats.reply_count++;
      userReplyAggregates.set(currentMessage.user, userStats);
    }
  }

  const result: UserReplyTimeStat[] = [];
  for (const [user, aggregates] of userReplyAggregates.entries()) {
    if (aggregates.reply_count > 0) { // Only include users with actual replies
      result.push({
        user,
        total_reply_time_seconds: aggregates.total_reply_time_seconds,
        reply_count: aggregates.reply_count,
        average_reply_time_seconds: aggregates.total_reply_time_seconds / aggregates.reply_count,
      });
    }
  }
  // Sort by average reply time, fastest first. Users with no replies are already excluded.
  return result.sort((a, b) => (a.average_reply_time_seconds ?? Infinity) - (b.average_reply_time_seconds ?? Infinity));
}     

// START: New User Activity Timeline Analysis for Comparison Chart

// Interface for the data structure expected by the comparison chart
// This should ideally be shared from or aligned with dashboard-charts.tsx
export interface UserTimelineDataPoint {
  time_unit: string; // e.g., "2023-W40" (Weekly), "2023-10" (Monthly), "2023" (Yearly)
  user_messages: Record<string, number>; // e.g., {"Alice": 10, "Bob": 5}
}

export interface UserComparisonTimelineData {
  weekly: UserTimelineDataPoint[];
  monthly: UserTimelineDataPoint[];
  yearly: UserTimelineDataPoint[];
}

export function calculateUserActivityTimeline(data: DataFrameRow[]): UserComparisonTimelineData {
  const weeklyActivity = new Map<string, Record<string, number>>(); // Key: YYYY-Www, Value: {user: count}
  const monthlyActivity = new Map<string, Record<string, number>>(); // Key: YYYY-MM, Value: {user: count}
  const yearlyActivity = new Map<string, Record<string, number>>();  // Key: YYYY,    Value: {user: count}

  if (!data || data.length === 0) {
    return { weekly: [], monthly: [], yearly: [] };
  }

  data.forEach(row => {
    if (row.user === 'group_notification') return; // Skip group notifications

    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      console.warn(`[calculateUserActivityTimeline] Invalid date for row:`, row);
      return; // Skip invalid dates
    }

    const user = row.user;

    // Yearly
    const yearKey = date.getFullYear().toString();
    const yearUserData = yearlyActivity.get(yearKey) || {};
    yearUserData[user] = (yearUserData[user] || 0) + 1;
    yearlyActivity.set(yearKey, yearUserData);

    // Monthly
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const monthKey = `${yearKey}-${month}`;
    const monthUserData = monthlyActivity.get(monthKey) || {};
    monthUserData[user] = (monthUserData[user] || 0) + 1;
    monthlyActivity.set(monthKey, monthUserData);

    // Weekly
    const { week, year: weekYear } = getISOWeekAndYearForTimeline(date);
    const weekKey = `${weekYear}-W${week.toString().padStart(2, '0')}`;
    const weekUserData = weeklyActivity.get(weekKey) || {};
    weekUserData[user] = (weekUserData[user] || 0) + 1;
    weeklyActivity.set(weekKey, weekUserData);
  });

  const formatMapToTimelinePoints = (activityMap: Map<string, Record<string, number>>): UserTimelineDataPoint[] => {
    return Array.from(activityMap.entries())
      .map(([time_unit, user_messages]) => ({ time_unit, user_messages }))
      .sort((a, b) => a.time_unit.localeCompare(b.time_unit)); // Sort chronologically
  };

  const result: UserComparisonTimelineData = {
    weekly: formatMapToTimelinePoints(weeklyActivity),
    monthly: formatMapToTimelinePoints(monthlyActivity),
    yearly: formatMapToTimelinePoints(yearlyActivity),
  };
  
  console.log("[calculateUserActivityTimeline] Generated data:", JSON.stringify(result, null, 2));
  return result;
}

// END: New User Activity Timeline Analysis for Comparison Chart

export interface MessageTypeCounts {
  sticker: number;
  image: number;
  video: number;
  document: number;
  audio: number;
  media: number; // generic media omitted
}

/**
 * Counts the number of each message type (sticker, image, video, document, audio, media) in the chat data.
 * @param data DataFrameRow[]
 * @returns MessageTypeCounts
 */
export function calculateMessageTypeCounts(data: DataFrameRow[]): MessageTypeCounts {
  const counts: MessageTypeCounts = {
    sticker: 0,
    image: 0,
    video: 0,
    document: 0,
    audio: 0,
    media: 0,
  };

  if (!data || data.length === 0) return counts;

  data.forEach(row => {
    const msg = row.message.toLowerCase();
    if (msg.includes('sticker omitted')) counts.sticker++;
    if (msg.includes('image omitted')) counts.image++;
    if (msg.includes('video omitted')) counts.video++;
    if (msg.includes('document omitted')) counts.document++;
    if (msg.includes('audio omitted')) counts.audio++;
    // Count generic <Media omitted> (not image/video/sticker/document/audio)
    if (msg.includes('<media omitted>')) counts.media++;
  });

  return counts;
}

// --- Shared Links Extraction ---
export interface SharedLink {
  url: string;
  user: string;
  timestamp: string; // ISO string
  message_text?: string;
}

export interface SharedLinksData {
  links: SharedLink[];
}

/**
 * Extracts all shared links from the chat data.
 * @param data DataFrameRow[]
 * @returns SharedLinksData
 */
export function extractSharedLinks(data: DataFrameRow[]): SharedLinksData {
  const links: SharedLink[] = [];
  if (!data || data.length === 0) return { links };

  data.forEach(row => {
    const foundLinks = row.message.match(LINK_REGEX);
    if (foundLinks) {
      foundLinks.forEach(url => {
        links.push({
          url,
          user: row.user,
          timestamp: new Date(row.date).toISOString(),
          message_text: row.message,
        });
      });
    }
  });
  console.log("links found from server:", links)
  return { links };
}

// Add ConversationStat and ConversationFlowData interfaces if not present
export interface ConversationStat {
  conversation_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  message_count: number;
  participants: number;
  message_density: number;
  // Helper property for internal use only
  last_sender?: string;
}

export interface UserCount {
  user: string;
  count: number;
}

export interface ConversationFlowData {
  total_conversations: number;
  conversation_stats: ConversationStat[];
  conversation_starters: UserCount[];
  conversation_enders: UserCount[];
}

// Conversation Flow Analysis
export function calculateConversationFlow(data: DataFrameRow[], gapMinutes: number = 60): ConversationFlowData {
  if (!data || data.length === 0) {
    return {
      total_conversations: 0,
      conversation_stats: [],
      conversation_starters: [],
      conversation_enders: [],
    };
  }

  // Sort data by date ascending
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const conversations: ConversationStat[] = [];
  let currentConv: ConversationStat | null = null;
  let lastMsgTime: Date | null = null;
  let lastConvId = 0;
  let participantsSet = new Set<string>();
  let starters: Record<string, number> = {};
  let enders: Record<string, number> = {};

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (row.user === 'group_notification') continue;
    const msgTime = new Date(row.date);
    if (!lastMsgTime || ((msgTime.getTime() - lastMsgTime.getTime()) / 60000 > gapMinutes)) {
      // New conversation
      if (currentConv) {
        currentConv.end_time = lastMsgTime!.toISOString();
        currentConv.duration = (new Date(currentConv.end_time).getTime() - new Date(currentConv.start_time).getTime()) / 60000;
        currentConv.participants = participantsSet.size;
        currentConv.message_density = currentConv.message_count / (currentConv.duration || 1);
        conversations.push(currentConv);
        // Mark ender
        if (currentConv.message_count > 0) {
          const lastUser = row.user;
          enders[currentConv.last_sender!] = (enders[currentConv.last_sender!] || 0) + 1;
        }
      }
      // Start new conversation
      lastConvId++;
      currentConv = {
        conversation_id: lastConvId,
        start_time: msgTime.toISOString(),
        end_time: msgTime.toISOString(),
        duration: 0,
        message_count: 1,
        participants: 1,
        message_density: 0,
        last_sender: row.user,
      } as any;
      participantsSet = new Set([row.user]);
      // Mark starter
      starters[row.user] = (starters[row.user] || 0) + 1;
    } else {
      // Continue current conversation
      if (currentConv) {
        currentConv.message_count++;
        participantsSet.add(row.user);
        currentConv.last_sender = row.user;
      }
    }
    lastMsgTime = msgTime;
  }
  // Push last conversation
  if (currentConv && currentConv.message_count > 0) {
    currentConv.end_time = lastMsgTime!.toISOString();
    currentConv.duration = (new Date(currentConv.end_time).getTime() - new Date(currentConv.start_time).getTime()) / 60000;
    currentConv.participants = participantsSet.size;
    currentConv.message_density = currentConv.message_count / (currentConv.duration || 1);
    conversations.push(currentConv);
    enders[currentConv.last_sender!] = (enders[currentConv.last_sender!] || 0) + 1;
  }

  // Remove helper property
  conversations.forEach(conv => { delete (conv as any).last_sender; });

  // Prepare starters and enders arrays
  const conversation_starters = Object.entries(starters).map(([user, count]) => ({ user, count }));
  const conversation_enders = Object.entries(enders).map(([user, count]) => ({ user, count }));

  return {
    total_conversations: conversations.length,
    conversation_stats: conversations,
    conversation_starters,
    conversation_enders,
  };
}

// Add after UserStat and related interfaces
export interface UserMessageTypeBreakdown {
  user: string;
  messages: number;
  stickers: number;
  media: number;
  documents: number;
}

// Add after other calculate* functions
export function calculateUserMessageTypeBreakdown(data: DataFrameRow[]): UserMessageTypeBreakdown[] {
  const userMap = new Map<string, UserMessageTypeBreakdown>();

  data.forEach(row => {
    if (row.user === 'group_notification') return;
    let userStats = userMap.get(row.user);
    if (!userStats) {
      userStats = { user: row.user, messages: 0, stickers: 0, media: 0, documents: 0 };
      userMap.set(row.user, userStats);
    }
    const msg = row.message.toLowerCase();
    if (msg.includes('sticker omitted')) {
      userStats.stickers++;
    } else if (
      msg.includes('image omitted') ||
      msg.includes('video omitted') ||
      msg.includes('audio omitted') ||
      msg.includes('<media omitted>')
    ) {
      userStats.media++;
    } else if (msg.includes('document omitted')) {
      userStats.documents++;
    } else {
      userStats.messages++;
    }
  });

  return Array.from(userMap.values());
}