from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from db.memory import save_message

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

from agents.router import analyze_intent_and_query
from db.memory import get_conversation

CONFIRM_PROMPT = ChatPromptTemplate.from_template("""
You are a professional bookstore assistant.
The user wants to know if they can buy "{title}" or if it is in stock.

STATUS: The book is AVAILABLE and IN STOCK.

Instructions:
1. Confirm that the book is available for purchase.
2. Be extremely concise (1 short sentence).
3. Do NOT include any emojis.
4. Vary your response based on the question (e.g., if they ask "can I buy it", say "Yes, it is available for purchase").

User Question: {question}
Previous Context: {history}
""")

def available_node(state):
    """
    Handle queries about specific book availability with concise responses.
    """
    original_question = state["question"]
    session_id = state["session_id"]
    books = state.get("books", [])
    history = state.get("history", [])

    if not books:
        answer = "I couldn't find information about that book."
        save_message(session_id, "user", original_question)
        save_message(session_id, "assistant", answer)
        return {"answer": answer}

    # Use the top retrieved book
    book = books[0]
    title = book.get('title', 'This book')
    
    # Build history context
    history_text = "\n".join([f"{m['role']}: {m['message']}" for m in history[-3:]])

    # Generate varied availability confirmation using LLM
    res = llm.invoke(CONFIRM_PROMPT.format(
        title=title, 
        question=original_question,
        history=history_text
    ))
    answer = res.content.strip()

    save_message(session_id, "user", original_question)
    save_message(session_id, "assistant", answer)

    return {"answer": answer}
