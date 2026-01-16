import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from rag.retriever import retrieve_books
from db.memory import get_conversation

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

INTENT_PROMPT = ChatPromptTemplate.from_template("""
You are an AI router and query optimizer for a bookstore.
Analyze the user's question and the conversation history to categorize intent and create a standalone search query.

REFERENCE RESOLUTION:
If the user refers to "it", "them", "this book", "these books", or "the first one", use the history to replace those words with the actual book titles mentioned by the assistant.

Return ONLY a JSON object. No preamble, no introductory text, no markdown code blocks.

EXAMPLES:
History: Assistant: "Hi! How can I help you today?"
User: "advantur and horrar sugerstions"
Output: {{"intent": "RECOMMEND", "search_query": "adventure and horror"}}

History: Assistant: "I suggest **To Kill a Mockingbird**."
User: "Who wrote it?"
Output: {{"intent": "EXPLAIN", "search_query": "author of To Kill a Mockingbird"}}

History: Assistant: "1. **Dune**  2. **Foundation**"
User: "tell me more about the first one"
Output: {{"intent": "EXPLAIN", "search_query": "Dune book summary"}}

CATEGORIES: GREETING, AVAILABILITY, EXPLAIN, RECOMMEND, METADATA, OUT_OF_SCOPE, AMBIGUOUS

INSTRUCTIONS FOR CATEGORIES:
- OUT_OF_SCOPE: Use if the user asks about anything other than books (e.g., cooking, sports, code, politics).
- AMBIGUOUS: Use if the question is nonsense, just random characters, or too vague to understand even with history.
- GREETING: Social greetings (hi, hello, etc.).
- AVAILABILITY: Questions about stock, buying, or presence in the store.
- EXPLAIN: Questions asking for details, summaries, or facts about specific books.
- RECOMMEND: Requests for book suggestions or browsing the catalog.
- METADATA: Questions about the store's total collection size or general capabilities.

Conversation History:
{history}

User Question: {question}
""")


def analyze_intent_and_query(question: str, history: list) -> dict:
    """
    Use LLM to semantically understand intent AND resolve references (Contextual Rewriting).
    """
    # Build a concise history string
    history_text = "\n".join([f"{m['role']}: {m['message']}" for m in history[-4:]])
    
    res = llm.invoke(INTENT_PROMPT.format(history=history_text, question=question))
    content = res.content.strip()
    
    # Try to extract JSON if LLM included markdown blocks or text
    try:
        if "{" in content and "}" in content:
            # Simple extraction: find first { and last }
            start = content.find("{")
            end = content.rfind("}") + 1
            json_str = content[start:end]
            data = json.loads(json_str)
        else:
            data = json.loads(content)
            
        intent = data.get("intent", "RECOMMEND").upper()
        search_query = data.get("search_query", question)
        
        # Mapping validation
        valid_intents = ["GREETING", "AVAILABILITY", "EXPLAIN", "RECOMMEND", "METADATA", "OUT_OF_SCOPE", "AMBIGUOUS"]
        if intent not in valid_intents:
            intent = "RECOMMEND"
            
        return {"intent": intent, "search_query": search_query}
    except Exception:
        return {"intent": "RECOMMEND", "search_query": question}


def route_query(state):
    """
    Router using semantic intent detection (LLM) and retrieval scores.
    """
    question = state["question"]
    session_id = state["session_id"]
    history = get_conversation(session_id)
    
    # Analyze Intent and Normalize Query using LLM (includes Contextual Reference Resolution)
    analysis = analyze_intent_and_query(question, history)
    intent = analysis["intent"]
    search_query = analysis["search_query"]

    # 3. Retrieve relevant books
    books = []
    if intent != "METADATA":
        # For EXPLAIN queries with resolved book titles, use exact matching
        if intent == "EXPLAIN" and " and " in search_query.lower():
            # Extract book titles from the resolved query (e.g., "Book A and Book B book summary")
            import re
            from db.mongo import books_collection
            
            # Remove common suffixes like "book summary", "why read", etc.
            clean_query = re.sub(r'\s+(book\s+summary|why\s+read|tell\s+me\s+about|explain)\s*$', '', search_query, flags=re.IGNORECASE)
            
            # Split by "and" to get individual titles
            potential_titles = [t.strip() for t in clean_query.split(" and ")]
            
            # Fetch books by exact title match (case-insensitive)
            books = []
            for title in potential_titles:
                book = books_collection.find_one(
                    {"title": {"$regex": f"^{re.escape(title)}$", "$options": "i"}}
                )
                if book:
                    # Convert MongoDB document to dict and add to results
                    book_dict = dict(book)
                    book_dict["score"] = 1.0  # Perfect match
                    books.append(book_dict)
            
            # If exact matching failed, fall back to vector search
            if not books:
                books = retrieve_books(search_query, limit=8)
        else:
            # Use vector search for other queries
            books = retrieve_books(search_query, limit=8)

    # Update state
    state["books"] = books
    state["history"] = history
    state["question"] = question
    state["intent"] = intent
    state["search_query"] = search_query  # Store LLM-resolved query for downstream use

    # 4. Routing Logic
    
    # METADATA: Collection-wide stats
    if intent == "METADATA":
        return {**state, "route": "general", "response_mode": "metadata"}

    # OUT_OF_SCOPE: Politely decline
    if intent == "OUT_OF_SCOPE":
        return {**state, "route": "general", "response_mode": "out_of_scope"}

    # AMBIGUOUS: Ask for clarification
    if intent == "AMBIGUOUS":
        return {**state, "route": "general", "response_mode": "ambiguous"}

    # GREETING: Friendly social response
    if intent == "GREETING":
        return {**state, "route": "general", "response_mode": "greeting"}

    # NO BOOKS FOUND: Fallback to general/unavailable
    if not books and intent in ["RECOMMEND", "AVAILABILITY", "EXPLAIN"]:
        return {**state, "route": "general", "response_mode": "unavailable"}

    top_score = books[0].get("score", 0) if books else 0
    MIN_RELEVANCE = 0.65

    # EXPLAIN: Fact-based or descriptive queries about a specific book
    if intent == "EXPLAIN" and top_score >= MIN_RELEVANCE:
        return {
            **state,
            "route": "general",
            "response_mode": "explain",
            "search_query": search_query  # Explicitly pass it
        }
    
    # AVAILABILITY: Inventory or stock-related queries
    elif intent == "AVAILABILITY":
        if top_score >= MIN_RELEVANCE:
            return {**state, "route": "available", "response_mode": "explain_with_availability"}
        else:
            return {**state, "route": "general", "response_mode": "unavailable_with_recommendation"}
    
    # RECOMMEND / DEFAULT: Suggestions or general browse
    else:
        return {**state, "route": "general", "response_mode": "recommend"}
