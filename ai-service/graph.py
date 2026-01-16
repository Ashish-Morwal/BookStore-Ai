from langgraph.graph import StateGraph
from schemas.state import GraphState

from agents.router import route_query
from agents.router import route_query
from agents.available import available_node
from agents.general import general_node


def build_graph():
    graph = StateGraph(GraphState)

    graph.add_node("router", route_query)
    graph.add_node("available", available_node)
    graph.add_node("general", general_node)

    graph.set_entry_point("router")

    graph.add_conditional_edges(
        "router",
        lambda s: s["route"],
        {
            "available": "available",
            "general": "general",
        }
    )

    return graph.compile()
