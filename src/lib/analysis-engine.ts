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
  biggest_message?: { text: string; length: number };
  most_used_emojis: { emoji: string; count: number }[]; // Added for top emojis per user
}

const MEDIA_OMITTED_KEYWORDS = [
  '<Media omitted>', 'image omitted', 'video omitted', 
  'GIF omitted', 'sticker omitted', 'audio omitted', 'document omitted'
];
const LINK_REGEX = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
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

  return {
    total_messages: data.length,
    total_words: totalWords,
    total_users: uniqueUserSet.size,
    first_message_date: new Date(data[0].date).toISOString(),
    last_message_date: new Date(data[data.length - 1].date).toISOString(),
    first_message_text: data[0].message,
    last_message_text: data[data.length - 1].message,
    first_message_sender: data[0].user,
    last_message_sender: data[data.length - 1].user,
    total_links: totalLinks,
    total_media_omitted: totalMediaOmitted,
  };
}

export function calculateUserStats(data: DataFrameRow[]): UserStat[] {
  if (!data || data.length === 0) return [];

  const userStatsMap = new Map<string, UserStat>();

  data.forEach(row => {
    if (row.user === 'group_notification') return; // Skip group notifications for user stats

    let userStat = userStatsMap.get(row.user);
    if (!userStat) {
      userStat = {
        user: row.user,
        message_count: 0,
        word_count: 0,
        avg_message_length: 0,
        links_shared_count: 0,
        media_shared_count: 0,
        biggest_message: { text: 'N/A', length: 0 },
        most_used_emojis: [],
      };
      // Temporary map for emoji counts for this user, not stored directly in UserStat yet
      (userStat as any)._emojiCounts = new Map<string, number>(); 
    }

    userStat.message_count++;
    userStat.word_count += row['Message Length'];

    // Count links for this message
    const linksInMessage = row.message.match(LINK_REGEX);
    if (linksInMessage) {
      userStat.links_shared_count += linksInMessage.length;
    }

    // Count media shared for this message
    if (MEDIA_OMITTED_KEYWORDS.some(keyword => row.message.includes(keyword))) {
      userStat.media_shared_count++;
    }

    // Extract and count emojis for this message
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

    userStatsMap.set(row.user, userStat);
  });

  // Final pass to calculate averages and process emojis
  const finalStats = Array.from(userStatsMap.values()).map(stat => {
    const emojiCountsMap = (stat as any)._emojiCounts as Map<string, number>; 
    let sortedEmojis: { emoji: string; count: number }[] = [];
    if (emojiCountsMap) {
      sortedEmojis = Array.from(emojiCountsMap.entries())
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Get top 5 emojis
    }

    return {
      ...stat,
      avg_message_length: stat.message_count > 0 ? stat.word_count / stat.message_count : 0,
      most_used_emojis: sortedEmojis,
      // _emojiCounts: undefined, // Remove temporary field explicitly if needed, though it won't be in the returned object if not spread
    };
  });

  return finalStats;
}

// Interfaces for Timeline Activity
export interface ActivityPoint {
  time_unit: string; // Format: YYYY-MM-DD for daily, YYYY-MM for monthly, YYYY for yearly
  message_count: number;
}

export interface TimelineActivityData {
  daily: ActivityPoint[];
  monthly: ActivityPoint[];
  yearly: ActivityPoint[];
}

export function calculateTimelineActivity(data: DataFrameRow[]): TimelineActivityData {
  console.log("[calculateTimelineActivity] Received data length:", data?.length);

  const dailyActivity = new Map<string, number>();
  const monthlyActivity = new Map<string, number>();
  const yearlyActivity = new Map<string, number>();

  if (!data || data.length === 0) {
    return { daily: [], monthly: [], yearly: [] };
  }

  data.forEach((row, index) => {
    const date = new Date(row.date);
    
    // Log first few processed dates for sanity check
    if (index < 3) { // Log only for the first 3 rows to avoid spamming
      console.log(`[calculateTimelineActivity] Processing row ${index}: date=${row.date}, parsedDate=${date.toISOString()}`);
    }

    // Ensure valid date before proceeding
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date encountered for row: ${JSON.stringify(row)}`);
      return; // Skip this row if the date is invalid
    }

    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');

    const dailyKey = `${year}-${month}-${day}`;
    const monthlyKey = `${year}-${month}`;
    const yearlyKey = year;

    dailyActivity.set(dailyKey, (dailyActivity.get(dailyKey) || 0) + 1);
    monthlyActivity.set(monthlyKey, (monthlyActivity.get(monthlyKey) || 0) + 1);
    yearlyActivity.set(yearlyKey, (yearlyActivity.get(yearlyKey) || 0) + 1);
  });

  const formatMapToActivityPoints = (activityMap: Map<string, number>): ActivityPoint[] => {
    return Array.from(activityMap.entries())
      .map(([time_unit, message_count]) => ({ time_unit, message_count }))
      .sort((a, b) => a.time_unit.localeCompare(b.time_unit)); // Sort chronologically
  };

  const result = {
    daily: formatMapToActivityPoints(dailyActivity),
    monthly: formatMapToActivityPoints(monthlyActivity),
    yearly: formatMapToActivityPoints(yearlyActivity),
  };
  console.log("[calculateTimelineActivity] Returning result:", JSON.stringify(result, null, 2));
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