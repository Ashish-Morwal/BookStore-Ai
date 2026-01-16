from typing import List, Dict, TypedDict, Literal


class GraphState(TypedDict):
    question: str
    route: str
    books: List[Dict]
    session_id: str
    history: List[Dict]
    answer: str
    response_mode: Literal["explain", "explain_with_availability", "unavailable_with_recommendation", "recommend", "greeting", "metadata", "unavailable"]
    search_query: str  # LLM-resolved query from router
    intent: str  # User intent classification
