from datetime import datetime
from db.mongo import db

memory_collection = db["chat_history"]


def save_message(session_id, role, message):
    memory_collection.insert_one({
        "session_id": session_id,
        "role": role,
        "message": message,
        "timestamp": datetime.utcnow()
    })


def get_conversation(session_id, limit=6):
    messages = memory_collection.find(
        {"session_id": session_id}
    ).sort("timestamp", -1).limit(limit)

    return list(reversed(list(messages)))
