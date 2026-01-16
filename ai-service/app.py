from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from main import answer_question
import json
import asyncio

app = FastAPI(
    title="Bookstore AI Service",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for connectivity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Bookstore AI Service running"}

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

@app.post("/chat")
def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid4())
    
    answer, session_id = answer_question(req.question, session_id)

    return {
        "session_id": session_id,
        "answer": answer
    }

async def stream_response(question: str, session_id: Optional[str]):
    """Generator that yields response chunks in SSE format"""
    session_id = session_id or str(uuid4())
    
    # Get the complete answer from the existing logic
    answer, final_session_id = answer_question(question, session_id)
    
    # Stream the answer word by word
    words = answer.split(' ')
    for i, word in enumerate(words):
        # Add space before word except for first word
        chunk = word if i == 0 else f" {word}"
        
        # Yield in SSE format
        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        
        # Small delay for smooth streaming effect (adjust as needed)
        await asyncio.sleep(0.03)  # 30ms delay per word
    
    # Send completion signal with session_id
    yield f"data: {json.dumps({'done': True, 'session_id': final_session_id})}\n\n"

@app.post("/chat-stream")
async def chat_stream(req: ChatRequest):
    """Streaming endpoint that returns response word by word"""
    return StreamingResponse(
        stream_response(req.question, req.session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable buffering for nginx
        }
    )
