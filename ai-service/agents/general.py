from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from db.memory import save_message
from db.mongo import books_collection
from utils.validator import extract_mentioned_books

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

PROMPT = ChatPromptTemplate.from_template("""
You are a professional bookstore assistant. 

CRITICAL RULES:
1. You MUST only recommend books that are directly RELEVANT to the user's specific request (e.g., matching the genre, author, or topic).
2. You can ONLY recommend books that appear in the AVAILABLE BOOKS list below.
3. If the retrieved books are NOT relevant to the user's specific request, say: "I couldn't find any books matching your request in our catalog."
4. Do NOT include any emojis in your response.
5. Return ONLY the book titles (one per line) for recommendations.

Previous conversation:
{history}

AVAILABLE BOOKS:
{context}

User question:
{question}
""")

GREETING_PROMPT = ChatPromptTemplate.from_template("""
You are a friendly and professional bookstore assistant.
The user said: "{question}"

Instructions:
1. Respond with a warm, professional greeting.
2. Briefly mention that you can help with book recommendations, details, or availability.
3. Be concise (max 2 sentences).
4. Do NOT use emojis.
""")

OUT_OF_SCOPE_PROMPT = ChatPromptTemplate.from_template("""
You are a professional bookstore assistant.
The user asked: "{question}"

Instructions:
1. Politely inform the user that you are an AI assistant specifically designed for bookstore inquiries.
2. Mention that you cannot help with this specific request but would be happy to discuss books or recommendations.
3. Be professional and concise (max 2 sentences).
4. Do NOT use emojis.
""")

AMBIGUOUS_PROMPT = ChatPromptTemplate.from_template("""
You are a professional bookstore assistant.
The user said: "{question}"

Instructions:
1. Politely state that you didn't quite understand the request or that it seems unclear.
2. Ask the user to provide more details or rephrase their question about books.
3. Be professional and concise (max 2 sentences).
4. Do NOT use emojis.
""")


def general_node(state):
    """
    Handle general queries, recommendations, and catalog metadata.
    Uses books already retrieved by router.
    
    Response modes:
    - "explain": Single book explanation
    - "unavailable_with_recommendation": Apology + alternatives
    - "recommend": Multiple book recommendations
    - "metadata": Catalog-wide statistics
    """
    original_question = state["question"]
    history = state.get("history", [])
    session_id = state["session_id"]
    books = state.get("books", [])
    response_mode = state.get("response_mode", "recommend")
    
    # RESPONSE MODE RENDERING (Metadata handled before LLM context build)
    if response_mode == "greeting":
        res = llm.invoke(GREETING_PROMPT.format(question=original_question))
        answer = res.content.strip()
        save_message(session_id, "user", original_question)
        save_message(session_id, "assistant", answer)
        return {"answer": answer}

    elif response_mode == "out_of_scope":
        res = llm.invoke(OUT_OF_SCOPE_PROMPT.format(question=original_question))
        answer = res.content.strip()
        save_message(session_id, "user", original_question)
        save_message(session_id, "assistant", answer)
        return {"answer": answer}

    elif response_mode == "ambiguous":
        res = llm.invoke(AMBIGUOUS_PROMPT.format(question=original_question))
        answer = res.content.strip()
        save_message(session_id, "user", original_question)
        save_message(session_id, "assistant", answer)
        return {"answer": answer}

    elif response_mode == "metadata":
        # Get actual count from DB
        count = books_collection.count_documents({})
        answer = f"Our bookstore currently has {count} books in its collection. You can ask for recommendations by genre, details about a specific title, or search for any author!"
        save_message(session_id, "user", original_question)
        save_message(session_id, "assistant", answer)
        return {"answer": answer}

    elif response_mode == "unavailable" or not books:
        # Fallback when no books matched the optimized query at all
        answer = "I'm sorry, I couldn't find any books in our catalog that match your request. Would you like to try searching for a different genre or title?"
        save_message(session_id, "user", original_question)
        save_message(session_id, "assistant", answer)
        return {"answer": answer}

    # Use top 3 books from vector search (no reranking needed for small dataset)
    final_books = books[:3]

    # Build context with ONLY retrieved books (including category for accuracy)
    context = "\n\n".join(
        f"Title: {b.get('title')}\nCategory: {b.get('category', 'N/A')}\nDescription: {b.get('description', '')}"
        for b in final_books
    )

    # Build history context (last 6 messages)
    history_text = "\n".join(
        f"{m['role']}: {m['message']}"
        for m in history[-6:]
    )

    # Generate answer with LLM (relevance explanation only)
    res = llm.invoke(
        PROMPT.format(
            history=history_text,
            context=context,
            question=original_question
        )
    )

    llm_response = res.content.strip()

    # POST-RETRIEVAL VALIDATION
    mentioned = extract_mentioned_books(llm_response, final_books)
    
    if response_mode == "explain":
        # EXPLAIN MODE: Answer questions about books (in catalog OR using general knowledge)
        search_query = state.get("search_query", "")
        
        # Check if the LLM-resolved query contains multiple books (has "and" in it)
        is_multi_book = " and " in search_query.lower() and len(final_books) > 1
        
        if is_multi_book:
            # Multi-book synthesis (books from catalog)
            # Just show the books in a clean list with spacing
            answer_parts = []
            for b in final_books:
                title = b.get('title', 'Unknown')
                description = b.get('description', 'N/A')
                answer_parts.append(f"**{title}**\n{description}")
            
            answer = "\n\n".join(answer_parts)
        else:
            # Single book explanation
            # Check if we have a good match in catalog
            if final_books and final_books[0].get('score', 0) >= 0.75:
                # Book found in catalog with good confidence
                book = final_books[0]
                # Try to match book title from search query
                search_lower = search_query.lower()
                for b in final_books:
                    if b.get('title', '').lower() in search_lower:
                        book = b
                        break
                
                title = book.get('title', 'Unknown')
                description = book.get('description', 'No description available.')
                category = book.get('category', 'N/A')
                
                explain_prompt = f"""You are a professional bookstore assistant.

User's Question: {original_question}

Book Details (from our catalog):
Title: {title}
Category: {category}
Description: {description}

Instructions:
1. Answer the user's question using the book details provided.
2. If asked about facts (author, theme, etc.), use your general knowledge while respecting the catalog info.
3. Keep it professional and concise (1-2 sentences).
4. Do NOT use emojis.
"""
                res = llm.invoke(explain_prompt)
                answer = f"**{title}**\n\n{res.content.strip()}"
            else:
                # Book NOT in catalog or low confidence - use LLM's general knowledge
                explain_prompt = f"""You are a helpful bookstore assistant.

User's Question: {original_question}

Instructions:
1. Answer the user's question about this book using your general knowledge.
2. Provide helpful information (author, summary, themes, etc. as relevant).
3. Be concise and professional (2-3 sentences max).
4. Do NOT use emojis.
5. Do NOT mention whether we have it in stock unless directly asked.
"""
                res = llm.invoke(explain_prompt)
                answer = res.content.strip()
    
    elif response_mode == "unavailable_with_recommendation":
        recommendations = "Here are some books you might like:\n\n"
        for book in final_books:
            title = book.get('title', 'Unknown')
            description = book.get('description', 'No description available.')
            recommendations += f"**{title}**\n{description}\n\n"
        answer = "Sorry, this book is not available in our catalog.\n\n" + recommendations
    
    else:
        # RECOMMEND MODE: Multiple book recommendations (default)
        if mentioned:
            answer = "Here are my recommendations:\n\n"
            for book in mentioned:
                title = book.get('title', 'Unknown')
                description = book.get('description', 'No description available.')
                answer += f"**{title}**\n{description}\n\n"
        else:
            if "couldn't find" in llm_response.lower() or "no" in llm_response.lower():
                answer = llm_response
            else:
                answer = "I couldn't find any books matching your request in our catalog."

    save_message(session_id, "user", original_question)
    save_message(session_id, "assistant", answer)

    return {"answer": answer}
