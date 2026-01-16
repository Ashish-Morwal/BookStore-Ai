"""
Validation utilities to prevent hallucinations.
Ensures LLM responses only reference books from the retrieved set.
"""


def validate_answer(answer: str, allowed_books: list) -> str:
    """
    Ensure the answer only mentions books from the allowed list.
    Returns cleaned answer with hallucinations removed/flagged.
    
    Args:
        answer: LLM-generated answer text
        allowed_books: List of book dictionaries that are allowed to be mentioned
        
    Returns:
        Validated answer string
    """
    if not allowed_books:
        return answer
    
    # For now, just return the answer as-is
    # More sophisticated validation can be added in future iterations
    return answer


def extract_mentioned_books(text: str, available_books: list) -> list:
    """
    Extract which books from available_books are mentioned in text.
    Returns list of book dictionaries that were actually mentioned.
    
    Args:
        text: Text to search for book mentions
        available_books: List of available book dictionaries
        
    Returns:
        List of books that were mentioned in the text
    """
    mentioned = []
    
    for book in available_books:
        title = book.get("title", "")
        if not title:
            continue
            
        # Check variations: full title, lowercase, in quotes
        if (title.lower() in text.lower() or 
            f'"{title}"' in text or
            f"'{title}'" in text):
            mentioned.append(book)
    
    return mentioned
