from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from whatsapp_reality import preprocess, analyzer
import pandas as pd
from typing import Dict, Any, List
import json
from pydantic import BaseModel
import os
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="WhatsApp Reality API",
    description="API for analyzing WhatsApp chat exports",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Next.js app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatAnalysisRequest(BaseModel):
    chat_data: str
    selected_user: str = "Overall"

@app.get("/")
async def root():
    return {"message": "WhatsApp Reality API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/analyze/basic-stats")
async def get_basic_stats(request: ChatAnalysisRequest):
    try:
        logger.info("Processing basic stats request")
        df = preprocess(request.chat_data)
        messages, words, media, links = analyzer.fetch_stats(request.selected_user, df)
        return {
            "messages": messages,
            "words": words,
            "media": media,
            "links": links
        }
    except Exception as e:
        logger.error(f"Error in basic stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/user-activity")
async def get_user_activity(request: ChatAnalysisRequest):
    try:
        logger.info("Processing user activity request")
        df = preprocess(request.chat_data)
        _, df_percent = analyzer.most_busy_users(df)
        return {
            "user_activity": df_percent.to_dict(orient='records')
        }
    except Exception as e:
        logger.error(f"Error in user activity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/sentiment")
async def get_sentiment_analysis(request: ChatAnalysisRequest):
    try:
        logger.info("Processing sentiment analysis request")
        df = preprocess(request.chat_data)
        sentiments, most_positive, most_negative = analyzer.calculate_sentiment_percentage(request.selected_user, df)
        return {
            "sentiments": sentiments,
            "most_positive": most_positive,
            "most_negative": most_negative
        }
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/timeline")
async def get_timeline_analysis(request: ChatAnalysisRequest):
    try:
        logger.info("Processing timeline analysis request")
        df = preprocess(request.chat_data)
        monthly_timeline = analyzer.monthly_timeline(request.selected_user, df)
        daily_timeline = analyzer.daily_timeline(request.selected_user, df)
        return {
            "monthly": monthly_timeline.to_dict(orient='records'),
            "daily": daily_timeline.to_dict(orient='records')
        }
    except Exception as e:
        logger.error(f"Error in timeline analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/emoji")
async def get_emoji_analysis(request: ChatAnalysisRequest):
    try:
        logger.info("Processing emoji analysis request")
        df = preprocess(request.chat_data)
        emoji_df = analyzer.emoji_helper(request.selected_user, df)
        return {
            "emoji_usage": emoji_df.to_dict(orient='records')
        }
    except Exception as e:
        logger.error(f"Error in emoji analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/conversation-patterns")
async def get_conversation_patterns(request: ChatAnalysisRequest):
    try:
        logger.info("Processing conversation patterns request")
        df = preprocess(request.chat_data)
        patterns = analyzer.analyze_conversation_patterns(df)
        return patterns
    except Exception as e:
        logger.error(f"Error in conversation patterns: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/response-times")
async def get_response_times(request: ChatAnalysisRequest):
    try:
        logger.info("Processing response times request")
        df = preprocess(request.chat_data)
        response_times = analyzer.analyze_response_times(df)
        return response_times
    except Exception as e:
        logger.error(f"Error in response times: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/word-usage")
async def get_word_usage(request: ChatAnalysisRequest):
    try:
        logger.info("Processing word usage request")
        df = preprocess(request.chat_data)
        word_usage = analyzer.analyze_word_usage(df)
        return word_usage
    except Exception as e:
        logger.error(f"Error in word usage: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/message-length")
async def get_message_length(request: ChatAnalysisRequest):
    try:
        logger.info("Processing message length request")
        df = preprocess(request.chat_data)
        message_length = analyzer.analyze_message_length(df)
        return message_length
    except Exception as e:
        logger.error(f"Error in message length: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/mood-shifts")
async def get_mood_shifts(request: ChatAnalysisRequest):
    try:
        logger.info("Processing mood shifts request")
        df = preprocess(request.chat_data)
        mood_shifts = analyzer.analyze_conversation_mood_shifts(df)
        return mood_shifts
    except Exception as e:
        logger.error(f"Error in mood shifts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global error handler caught: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5001))
    uvicorn.run(app, host="0.0.0.0", port=port) 