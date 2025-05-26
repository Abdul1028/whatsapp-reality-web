import { NextResponse } from 'next/server';
import { DataFrameRow } from '@/components/upload-form'; // Ensure this path is correct
import { parse as dateParse, isValid as isDateValid, format as formatDateISO } from 'date-fns';
import fs from 'fs/promises'; // Import fs/promises
import path from 'path';         // Import path
import crypto from 'crypto';     // Import crypto

// Robust date parsing using date-fns
function parseDateString(datePart: string, timePart: string, formatHint: 'android12' | 'android24' | 'ios12' | 'ios24' | 'unknown'): Date | null {
    let formatString = '';
    const cleanedTimePart = timePart.replace(/[\u202f\s]/g, ' ').trim(); // Replace U+202F and other spaces, then trim
    const cleanedDatePart = datePart.trim();

    switch (formatHint) {
        case 'android12':
            formatString = 'MM/dd/yy h:mm a';
            break;
        case 'android24':
            formatString = 'MM/dd/yy HH:mm';
            break;
        case 'ios12':
            // Changed from MM/dd/yy to dd/MM/yy based on user feedback and common iOS format
            formatString = 'dd/MM/yy h:mm:ss a';
            break;
        case 'ios24':
            // Changed from MM/dd/yy to dd/MM/yy based on user feedback and common iOS format
            formatString = 'dd/MM/yy HH:mm:ss'; 
            break;
        default:
            console.warn(`[parseDateString] Unknown formatHint: ${formatHint} for ${cleanedDatePart} ${cleanedTimePart}`);
            return null;
    }

    const fullDateTimeString = `${cleanedDatePart} ${cleanedTimePart}`;

    try {
        const referenceDate = new Date(); 
        const parsed = dateParse(fullDateTimeString, formatString, referenceDate);

        if (isDateValid(parsed)) {
            return parsed;
        }
        // Log specific failure for this format string attempt
        console.warn(`[parseDateString] Failed to parse date: "${fullDateTimeString}" with primary format: "${formatString}". Hint: ${formatHint}`);
        
        // Attempt fallback for ambiguous dd/MM vs MM/dd if primary parse fails for iOS/Android
        // This is a common point of failure if the day part is <= 12.
        let fallbackFormatString = '';
        if (formatHint === 'ios12' && formatString === 'dd/MM/yy h:mm:ss a') fallbackFormatString = 'MM/dd/yy h:mm:ss a';
        else if (formatHint === 'ios12' && formatString === 'MM/dd/yy h:mm:ss a') fallbackFormatString = 'dd/MM/yy h:mm:ss a';
        else if (formatHint === 'ios24' && formatString === 'dd/MM/yy HH:mm:ss') fallbackFormatString = 'MM/dd/yy HH:mm:ss';
        else if (formatHint === 'ios24' && formatString === 'MM/dd/yy HH:mm:ss') fallbackFormatString = 'dd/MM/yy HH:mm:ss';
        else if (formatHint === 'android12' && formatString === 'MM/dd/yy h:mm a') fallbackFormatString = 'dd/MM/yy h:mm a';
        else if (formatHint === 'android12' && formatString === 'dd/MM/yy h:mm a') fallbackFormatString = 'MM/dd/yy h:mm a';
        else if (formatHint === 'android24' && formatString === 'MM/dd/yy HH:mm') fallbackFormatString = 'dd/MM/yy HH:mm';
        else if (formatHint === 'android24' && formatString === 'dd/MM/yy HH:mm') fallbackFormatString = 'MM/dd/yy HH:mm';

        if (fallbackFormatString) {
            console.log(`[parseDateString] Attempting fallback format: "${fallbackFormatString}" for "${fullDateTimeString}"`);
            const fallbackParsed = dateParse(fullDateTimeString, fallbackFormatString, referenceDate);
            if (isDateValid(fallbackParsed)) {
                console.log(`[parseDateString] Successfully parsed with fallback format: "${fallbackFormatString}"`);
                return fallbackParsed;
            }
            console.warn(`[parseDateString] Fallback format "${fallbackFormatString}" also failed for "${fullDateTimeString}"`);
        }
        return null; // Return null if all attempts fail
    } catch (e) {
        console.error(`[parseDateString] Error parsing date: "${fullDateTimeString}" with format "${formatString}"`, e);
        return null;
    }
}

// Regexes: Use ([\s\S]*) for message content for clarity and broad compatibility.
const ANDROID_12HR_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))\s*-\s*([^:]+?):\s*([\s\S]*)$/;
const ANDROID_12HR_SYSTEM_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))\s*-\s*([\s\S]*)$/;
const ANDROID_24HR_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+?):\s*([\s\S]*)$/;
const ANDROID_24HR_SYSTEM_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2})\s*-\s*([\s\S]*)$/;
const IOS_12HR_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))\]\s*([^:]+?):\s*([\s\S]*)$/;
const IOS_12HR_SYSTEM_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))\]\s*([\s\S]*)$/;
const IOS_24HR_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2})\]\s*([^:]+?):\s*([\s\S]*)$/;
const IOS_24HR_SYSTEM_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2})\]\s*([\s\S]*)$/;
const LRM_RLE_PATTERN = /[\u200E\u200F\u202A-\u202E]/g;

function determineFormatAndParseLine(line: string): {
    dateString?: string; timeString?: string; user?: string; message?: string; formatHint: 'android12' | 'android24' | 'ios12' | 'ios24' | 'unknown'; isSystem: boolean;
} | null {
    let match;
    const cleanedLine = line.replace(LRM_RLE_PATTERN, '').replace(/\u202f/g, ' '); // Replace U+202F with normal space globally for regex matching robustness

    // Match attempts using cleanedLine
    if ((match = cleanedLine.match(ANDROID_12HR_REGEX))) return { dateString: match[1], timeString: match[2], user: match[3]?.trim(), message: match[4]?.trim(), formatHint: 'android12', isSystem: false };
    if ((match = cleanedLine.match(ANDROID_24HR_REGEX))) return { dateString: match[1], timeString: match[2], user: match[3]?.trim(), message: match[4]?.trim(), formatHint: 'android24', isSystem: false };
    if ((match = cleanedLine.match(IOS_12HR_REGEX))) return { dateString: match[1], timeString: match[2], user: match[3]?.trim(), message: match[4]?.trim(), formatHint: 'ios12', isSystem: false };
    if ((match = cleanedLine.match(IOS_24HR_REGEX))) return { dateString: match[1], timeString: match[2], user: match[3]?.trim(), message: match[4]?.trim(), formatHint: 'ios24', isSystem: false };
    if ((match = cleanedLine.match(ANDROID_12HR_SYSTEM_REGEX))) return { dateString: match[1], timeString: match[2], user: 'group_notification', message: match[3]?.trim(), formatHint: 'android12', isSystem: true };
    if ((match = cleanedLine.match(ANDROID_24HR_SYSTEM_REGEX))) return { dateString: match[1], timeString: match[2], user: 'group_notification', message: match[3]?.trim(), formatHint: 'android24', isSystem: true };
    if ((match = cleanedLine.match(IOS_12HR_SYSTEM_REGEX))) return { dateString: match[1], timeString: match[2], user: 'group_notification', message: match[3]?.trim(), formatHint: 'ios12', isSystem: true };
    if ((match = cleanedLine.match(IOS_24HR_SYSTEM_REGEX))) return { dateString: match[1], timeString: match[2], user: 'group_notification', message: match[3]?.trim(), formatHint: 'ios24', isSystem: true };
    
    return null;
}

function isFirstLineGroupNotification(line: string): boolean {
    // Checks if the line lacks a sender after the timestamp (structure-based)
    // Android: 12/12/23, 1:23 pm - sender: message
    // iOS: [12/12/23, 1:23:45 PM] sender: message
    // System: no sender (no colon after timestamp)
    const androidUserPattern = /^\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?\s*-\s*[^:]+?:/;
    const iosUserPattern = /^\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*[^:]+?:/;
    return !(androidUserPattern.test(line) || iosUserPattern.test(line));
}

function parseChatFile(rawData: string): DataFrameRow[] {
    const lines = rawData.split('\n');
    const dataFrame: DataFrameRow[] = [];

    // Check only the first non-empty line for group notification
    let firstNonEmptyLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
            firstNonEmptyLineIdx = i;
            break;
        }
    }
    if (firstNonEmptyLineIdx !== -1 && isFirstLineGroupNotification(lines[firstNonEmptyLineIdx])) {
        console.log('[parseChatFile] First message is a group notification:', lines[firstNonEmptyLineIdx]);
        // You can flag or handle this as needed
    }

    for (let i = 0; i < lines.length; i++) {    
        const line = lines[i];
        if (line.trim() === '') continue;
        
        const parsedLine = determineFormatAndParseLine(line);

        if (parsedLine && parsedLine.dateString && parsedLine.timeString && parsedLine.user && parsedLine.message) {
            // Line has the structure of a new message
            const parsedDate = parseDateString(parsedLine.dateString, parsedLine.timeString, parsedLine.formatHint);

            if (parsedDate) {
                // Successfully parsed date for a structurally valid new message line
                const isoDateString = parsedDate.toISOString();
                const currentHour = parsedDate.getHours();
                let periodString = `${currentHour}-${currentHour + 1}`;
                if (currentHour === 23) periodString = '23-00';
                else if (currentHour === 0) periodString = '00-1';

                dataFrame.push({
                    date: isoDateString,
                    user: parsedLine.user,
                    message: parsedLine.message,
                    'Message Length': parsedLine.message.split(' ').length,
                    'Conv code': null, // Will be calculated in the second pass
                    'Conv change': false,
                    'Is reply': false,
                    'Sender change': false,
                    only_date: isoDateString.split('T')[0],
                    year: parsedDate.getFullYear(),
                    month_num: parsedDate.getMonth() + 1,
                    month: parsedDate.toLocaleString('default', { month: 'long' }),
                    day: parsedDate.getDate(),
                    day_name: parsedDate.toLocaleString('default', { weekday: 'long' }),
                    hour: currentHour,
                    minute: parsedDate.getMinutes(),
                    period: periodString,
                    'Reply Time': 0,
                    'Inter conv time': 0,
                });
            } else {
                // Line matched new message structure, but its date couldn't be parsed.
                // Log a warning and skip this line from being added or appended.
                console.warn(`[parseChatFile] Date parsing failed for a structured new message line. Original Line: "${line}". Extracted Date: "${parsedLine.dateString}", Time: "${parsedLine.timeString}". Format Hint: ${parsedLine.formatHint}. This line will be skipped.`);
            }
        } else {
            // Line does NOT have the structure of a new message (it's a continuation or unparsable)
            if (dataFrame.length > 0) {
                // Append to the previous message
                dataFrame[dataFrame.length - 1].message += '\n' + line.trim();
                // Update message length of the modified previous message
                dataFrame[dataFrame.length - 1]['Message Length'] = dataFrame[dataFrame.length - 1].message.split(/[\s\n]+/).length;
            } else {
                 // Line is a continuation or unparsable, but there's no previous message (e.g., file starts with a multi-line message part or garbage)
                 console.warn('[parseChatFile] Line does not match message structure and no prior message exists for continuation. Line: ', line);
            }
        }
    }

    // Second pass: Calculate Sender change, Reply Time, Conversation Clustering, Is reply, Inter conv time
    let currentConvCode = 1;
    for (let i = 0; i < dataFrame.length; i++) {
        let interMessageTimeSeconds = 0;

        if (i === 0) {
            dataFrame[i]['Sender change'] = false;
            dataFrame[i]['Reply Time'] = 0;
            dataFrame[i]['Conv code'] = currentConvCode;
            dataFrame[i]['Conv change'] = true;
            dataFrame[i]['Is reply'] = false; // First message cannot be a reply
            dataFrame[i]['Inter conv time'] = 0;
        } else {
            const currentRow = dataFrame[i];
            const prevRow = dataFrame[i-1];
            const currentDate = new Date(currentRow.date).getTime();
            const prevDate = new Date(prevRow.date).getTime();

            if (!isNaN(currentDate) && !isNaN(prevDate)) {
                interMessageTimeSeconds = (currentDate - prevDate) / 1000;
            } else {
                console.warn(`[parseChatFile] Invalid date(s) encountered during calculations for row ${i}`);
            }

            // Sender change
            currentRow['Sender change'] = currentRow.user !== prevRow.user;

            // Conversation Clustering
            if (interMessageTimeSeconds > 300) { // More than 5 minutes threshold
                currentConvCode++;
                currentRow['Conv change'] = true;
            } else {
                currentRow['Conv change'] = false;
            }
            currentRow['Conv code'] = currentConvCode;

            // Is reply
            currentRow['Is reply'] = currentRow['Sender change'] && currentRow.user !== 'group_notification' && !currentRow['Conv change'];

            // Reply Time (in minutes, if it is a reply)
            if (currentRow['Is reply']) {
                currentRow['Reply Time'] = parseFloat((interMessageTimeSeconds / 60).toFixed(2));
            } else {
                currentRow['Reply Time'] = 0;
            }

            // Inter conv time (in minutes, if it is a new conversation)
            if (currentRow['Conv change']) {
                currentRow['Inter conv time'] = parseFloat((interMessageTimeSeconds / 60).toFixed(2));
            } else {
                currentRow['Inter conv time'] = 0;
            }
        }
    }

    return dataFrame;
}

export async function POST(request: Request) {
    try {
        const rawData = await request.text();
        if (!rawData) {
            return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        }
        console.log(`[API process-chat] Received raw data, length: ${rawData.length}`);
        const startTime = Date.now();
        const parsedDataFrame = parseChatFile(rawData);
        const endTime = Date.now();
        console.log(`[API process-chat] Parsing completed in ${endTime - startTime}ms`);
        console.log(`[API process-chat] Processed ${parsedDataFrame.length} messages into DataFrame.`);

        const dataId = crypto.randomUUID();
        const filePath = path.join('/tmp', `chat-analysis-${dataId}.json`);
        
        // Ensure /tmp directory exists (especially for local dev, Vercel usually has it)
        // For local, fs.mkdir might be needed if /tmp doesn't exist or isn't writable by default.
        // For Vercel, /tmp is writable.
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
        } catch (dirError) {
            // Log if directory creation specifically fails, but proceed as /tmp might exist
            console.warn(`[API process-chat] Could not create directory ${path.dirname(filePath)}, assuming it exists:`, dirError);
        }
        
        await fs.writeFile(filePath, JSON.stringify(parsedDataFrame));
        console.log(`[API process-chat] Saved processed DataFrame to ${filePath}`);

        return NextResponse.json({
            message: 'Chat data processed and saved successfully.',
            dataId: dataId,
            processedMessagesCount: parsedDataFrame.length
            // Removed: processedData: parsedDataFrame 
        });
    } catch (error) {
        console.error('[API process-chat] Error processing chat file:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage, details: error instanceof Error ? error.stack : undefined }, { status: 500 });
    }
} 