from langchain_core.messages import SystemMessage

from movie_backend.ai.prompts.system_prompt import SYSTEM_PROMPT
from movie_backend.ai.graph.state import AgentState
from movie_backend.ai.configs.config import llm


def chat_bot(state: AgentState, tools) -> AgentState:
    system = SystemMessage(content=SYSTEM_PROMPT)

    llm_with_tools = llm.bind_tools(tools)

    response = llm_with_tools.invoke(
        [system] + state["messages"]
    )

    return {
        "messages": [response]
    }