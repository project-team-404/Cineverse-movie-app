from movie_app.movie_backend.ai.graph.state import AgentState

def decision(state: AgentState):
    request = state["messages"][-1]

    if request.tool_calls:
        return "continue"
    else:
        return "END"