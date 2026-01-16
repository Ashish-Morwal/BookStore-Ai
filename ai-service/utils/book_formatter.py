def build_book_text(book: dict) -> str:
    parts = []

    if book.get("title"):
        parts.append(f"Title: {book['title']}")

    if book.get("author"):
        parts.append(f"Author: {book['author']}")

    if book.get("category"):
        parts.append(f"Category: {book['category']}")

    if book.get("description"):
        parts.append(f"Description: {book['description']}")

    return "\n".join(parts)
