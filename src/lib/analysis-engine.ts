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
const EMOJI_REGEX = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+/g;

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