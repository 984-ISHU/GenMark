from your_langgraph_file import app  # your compiled StateGraph

async def run_langgraph_for_project(project_data: dict):
    # You can enrich or transform this data if needed
    result = await app.ainvoke(project_data)  # async version
    return result
