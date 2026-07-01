from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, START, END

from movie_backend.ai.graph.state import AgentState
from movie_backend.ai.graph.nodes import chat_bot
from movie_backend.ai.graph.router import decision


def build_graph(tools):
    graph = StateGraph(AgentState)

    tool_node = ToolNode(tools)

    graph.add_node(
        "chat_bot",
        lambda state: chat_bot(state, tools)
    )

    graph.add_node(
        "tool_node",
        tool_node
    )

    graph.add_edge(
        START,
        "chat_bot"
    )

    graph.add_conditional_edges(
        "chat_bot",
        decision,
        {
            "continue": "tool_node",
            "END": END,
        },
    )

    graph.add_edge(
        "tool_node",
        "chat_bot"
    )

    return graph.compile()