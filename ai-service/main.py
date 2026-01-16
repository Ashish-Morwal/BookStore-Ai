import uuid
from graph import build_graph

_graph = build_graph()

def answer_question(question: str, session_id: str | None = None):
    if session_id is None:
        session_id = str(uuid.uuid4())

    result = _graph.invoke({
        "question": question,
        "session_id": session_id
    })

    return result["answer"], session_id


if __name__ == "__main__":
    session_id = None

    while True:
        q = input("\nUser: ")
        if q.lower() in ["exit", "quit"]:
            break

        answer, session_id = answer_question(q, session_id)

        print("Bot:")
        print(answer)
