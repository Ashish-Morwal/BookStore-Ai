from db.mongo import books_collection
from embeddings.model import embed_text

def retrieve_books(query: str, limit: int = 5):
    
    if not query or len(query.strip()) < 3:
        return list(
            books_collection.find(
                {},
                {"_id": 0, "title": 1, "category": 1, "description": 1}
            ).limit(limit)
        )

    query_vector = embed_text(query)

    results = books_collection.aggregate([
        {
            "$vectorSearch": {
                "index": "book_vector_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": limit
            }
        },
        {
            "$project": {
                "_id": 0,
                "title": 1,
                "category": 1,
                "description": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ])

    return list(results)
