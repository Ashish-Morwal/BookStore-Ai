# Bookstore AI Service

AI-powered chatbot service for book recommendations, availability checks, and customer assistance.

## Features

- 🤖 **Smart Intent Classification**: Automatically detects user intent (recommendations, availability, explanations)
- 📚 **RAG-based Retrieval**: Uses vector search to find relevant books
- 💬 **Edge Case Handling**: Handles greetings, out-of-scope queries, and ambiguous inputs
- ⚡ **Streaming Responses**: Text appears word-by-word like ChatGPT
- 🧠 **Context-Aware**: Maintains conversation history per session

## Tech Stack

- **FastAPI** - Web framework
- **LangChain** - LLM orchestration
- **LangGraph** - Agent workflow
- **MongoDB** - Database
- **Sentence Transformers** - Vector embeddings
- **Groq** - LLM provider

## Local Development

### Prerequisites
- Python 3.10+
- MongoDB instance
- Groq API key

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```env
GROQ_API_KEY=your_key_here
MONGO_URI=your_mongodb_uri
```

3. Run the server:
```bash
uvicorn app:app --reload --port 8000
```

4. Visit http://localhost:8000/docs for API documentation

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## API Endpoints

- `GET /` - Health check
- `POST /chat` - Standard chat (returns complete response)
- `POST /chat-stream` - Streaming chat (returns word-by-word via SSE)

## Project Structure

```
ai-service/
├── app.py              # FastAPI application
├── main.py             # Answer generation logic
├── graph.py            # LangGraph workflow
├── agents/             # Agent modules (router, general, available)
├── rag/                # Vector retrieval
├── db/                 # Database connections
├── schemas/            # Pydantic schemas
└── utils/              # Helper functions
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | API key for Groq LLM |
| `MONGO_URI` | MongoDB connection string |
