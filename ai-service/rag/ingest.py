from db.mongo import books_collection
from utils.book_formatter import build_book_text
from embeddings.model import embed_text

def ingest_books():
    print("Starting ingestion...")

    books = books_collection.find()
    count = 0

    for book in books:
        count += 1
        title = book.get("title", "UNKNOWN")
        print(f"Processing: {title}")

        text = build_book_text(book)
        embedding = embed_text(text)

        books_collection.update_one(
            {"_id": book["_id"]},
            {"$set": {"embedding": embedding}}
        )

        print(f"Embedded: {title}")

    print(f"Finished. Total processed: {count}")

if __name__ == "__main__":
    ingest_books()
