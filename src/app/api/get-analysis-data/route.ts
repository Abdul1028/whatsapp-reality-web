import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dataId = searchParams.get('dataId');

    if (!dataId) {
        return NextResponse.json({ error: 'Missing dataId parameter' }, { status: 400 });
    }

    const filePath = path.join('/tmp', `chat-analysis-${dataId}.json`);

    try {
        console.log(`[API get-analysis-data] Attempting to read file: ${filePath}`);
        const fileContents = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContents);
        console.log(`[API get-analysis-data] Successfully read and parsed data for dataId: ${dataId}`);
        return NextResponse.json(data);
    } catch (error) {
        console.error(`[API get-analysis-data] Error reading or parsing file for dataId ${dataId}:`, error);
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json({ error: 'Analysis data not found. It might have expired or the ID is invalid.' }, { status: 404 });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: `Failed to retrieve analysis data: ${errorMessage}` }, { status: 500 });
    }
} 