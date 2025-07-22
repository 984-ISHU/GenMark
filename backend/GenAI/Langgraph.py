import time
from google.genai.types import Part, Content
import aiohttp
import os
import requests
import json
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, List, Annotated
from langgraph.channels import LastValue
from dotenv import load_dotenv
from io import BytesIO
from google import genai as gai
from google.genai import types
from pprint import pprint
import asyncio

# --- Environment and API Setup (Unchanged) ---
load_dotenv()

GROQ_API = os.getenv("GROQ_API")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

client = gai.Client(api_key=GOOGLE_API_KEY)

# --- AgentState Definition (Unchanged) ---
# Replace your entire AgentState class with this one

class AgentState(TypedDict):
    user_id: str
    project_id: str
    product_id: str
    name: str  # project_name
    product_name: str
    description: str
    product_url: str
    price: float
    discount: float
    image_ids: List[str]
    target_audience: str
    output_format: str
    status: str
    
    # This is the critical line that fixes the error
    generationDone: Annotated[str, LastValue(str)]
    
    generated_outputs_id: str
    automate_campaign: Optional[bool]
    
    text_prompt: str
    image_prompt: str
    video_prompt: str

    text_output: Annotated[Optional[str], LastValue(Optional[str])]
    image_output: Annotated[Optional[str], LastValue(Optional[str])]
    video_output: Annotated[Optional[str], LastValue(Optional[str])]

    image_bytes: Optional[BytesIO]

# --- Agent and Router Functions (Largely Unchanged) ---
# Note: The core logic of your agents is sound, so we keep them as is.

def manager_router(state: AgentState) -> str:
    """
    Helps to route the flow of the execution from the manager node
    """
    gen_status = state.get("generationDone")
    print(f"Manager router - generationDone: {gen_status}")

    if gen_status in (None, "NotStarted"):
        return "generate"
    elif gen_status == "Generated":
        return "display"
    elif gen_status == "Edit":
        return "edit"
    elif gen_status == "Automate":
        return "automate"
    elif gen_status == "Finalized":
        return "Done"
    else:
        print(f"Invalid generationDone value: {gen_status}, defaulting to END")
        return "Done"

def generate_prompt(state: AgentState) -> dict:
    """
    Helps to recieve the information and generate accurate prompts for text, image and video output based on the user output requirement
    """
    print("Inside Prompt Generator")
    product_name = state.get("product_name", "")
    description = state.get("description", "")
    discount = state.get("discount", 0.0)
    target_audience = state.get("target_audience", "")
    output_format = state.get("output_format", "")

    system_prompt = (
        "You are an expert prompt engineer.\n"
        "You help users market their products by generating highly effective generation prompts for a multimodal LLM.\n"
        "Your job is to create prompts that guide the LLM to generate **marketing content** in the form of text, images, and videos.\n\n"
        "Your responsibilities include:\n"
        "- Accurately interpret the user's intent and the desired output format, and generate prompts ONLY for the formats requested.\n"
        "- Always generate clear, goal-oriented prompts for **text**, **image**, and **video** when specified.\n\n"
        "**Image Prompt Rules:**\n"
        "- Always assume that one or more reference images of the product are provided.\n"
        "- The image prompt must explicitly reference the input image(s).\n"
        "- The product's appearance (color, shape, texture) must remain exactly as shown in the reference images.\n"
        "- The background should be an iconic landmark from specified location.\n"
        "- If a discount is provided (> 0), include a small discount box in the image (e.g., price tag overlay).\n\n"
        "**Text Prompt Rules:**\n"
        "- Personalize the text based on location and age category.\n"
        "- Mention the price and discount clearly and persuasively.\n\n"
        "**Video Prompt:**\n"
        "- Only generate this if explicitly requested in the output format.\n"
        "- The background should be an iconic landmark from specified location..\n"
        "- Follow the same consistency guidelines (product appearance, audience, tone).\n\n"
        "- If the output format is unclear or ambiguous, generate prompts ONLY for **text** and **image** (skip video).\n"
        "- DO NOT introduce assumptions — follow the user's tone, platform, and audience exactly.\n\n"
        "**VERY IMPORTANT**:\n"
        "Respond ONLY with a valid JSON object, nothing else.\n"
        "The JSON object must look like this:\n"
        "```json\n"
        "{\n"
        "  \"text_prompt\": \"...\" or null,\n"
        "  \"image_prompt\": \"...\" or null,\n"
        "  \"video_prompt\": \"...\" or null\n"
        "}\n"
        "```"
    )

    user_message = (
        f"Product Name: {product_name}\n"
        f"Description: {description}\n"
        f"Discount: {discount}% off\n"
        f"Target Audience: {target_audience}\n"
        f"Desired Output Format: {output_format}\n\n"
        f"Generate highly effective prompts suitable for generating this kind of content."
    )

    data = {"messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}], "model": "llama-3.1-8b-instant", "temperature": 0.7}
    headers = {"Authorization": f"Bearer {GROQ_API}", "Content-Type": "application/json"}
    prompts = {"text_prompt": None, "image_prompt": None, "video_prompt": None}

    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=45)
        response.raise_for_status()
        result = response.json()["choices"][0]["message"]["content"]
        if result.startswith("```"):
            result = result.strip("```json").strip("```").strip()
        prompts = json.loads(result)
        print("Generated prompts:")
        pprint(prompts)
    except Exception as e:
        print("Prompt generation failed:", e)

    return {"text_prompt": prompts.get("text_prompt"), "image_prompt": prompts.get("image_prompt"), "video_prompt": prompts.get("video_prompt")}

def text_agent(state: AgentState) -> dict:
    print("--- Running Text Agent ---")
    if not state.get("text_prompt"):
        return {"text_output": None}
    text_prompt, project_id = state.get("text_prompt", ""), state.get("project_id", "")
    system_prompt = (
        "You are a senior marketing copywriter for a global brand.\n"
        "Your job is to generate short, compelling, and emotionally resonant marketing copy for direct use in digital campaigns.\n\n"
        "You must:\n"
        "- Write content that is persuasive, modern, and aligned with brand voice.\n"
        "- Always return **final, ready-to-publish** marketing text — never suggestions, outlines, or sample formats.\n"
        "- Avoid lists, bullet points, or meta explanations (e.g., 'Here are 3 options...').\n"
        "- Your output should feel native to social platforms (e.g., Instagram, TikTok), emotionally engaging, and tailored to the target audience.\n"
        "- Limit your response to **a maximum of 2 concise, energetic paragraphs**.\n"
        "- Ensure tone consistency and make it instantly shareable without needing editing or review.\n\n"
        "Only return the marketing text — no headers, quotes, or markdown formatting."
    )
    try:
        response = client.models.generate_content(model="gemini-2.5-flash", config=types.GenerateContentConfig(system_instruction=system_prompt), contents=text_prompt)
        generated_text = response.text.strip()
        print("✅ Text generation completed.")
        api_url = f"https://genmark-mzoy.onrender.com/api/project/upload-generated-text/{project_id}"
        requests.put(api_url, data={"text": generated_text}, timeout=10)
        return {"text_output": generated_text}
    except Exception as e:
        print(f"❌ Text generation failed: {e}")
        return {"text_output": None}

async def image_agent(state: dict) -> dict:
    print("--- Running Image Agent ---")
    if not state.get("image_prompt"):
        return {"image_bytes": None}
    prompt, project_id, image_ids = state["image_prompt"], state.get("project_id"), state.get("image_ids")
    parts = [Part(text=(
        "You are an expert marketing image generator.\n"
        "Always preserve the product's exact appearance as seen in the uploaded image(s).\n"
        "Only generate the background, context, or marketing setting based on the prompt below:\n\n"
        f"{prompt}"
    ))]
    async with aiohttp.ClientSession() as session:
        for image_id in image_ids:
            api_url = f"https://genmark-mzoy.onrender.com/api/project/uploaded/image/{image_id}"
            async with session.get(api_url) as response:
                if response.status == 200:
                    image_data = await response.read()
                    content_type = response.headers.get('content-type', 'image/jpeg')
                    parts.append(Part(inline_data={"mime_type": content_type, "data": image_data}))
    if len(parts) == 1:
        return {"image_bytes": None, "project_id": project_id}
    try:
        response = client.models.generate_content(model="gemini-2.0-flash-preview-image-generation", contents=Content(parts=parts), config=types.GenerateContentConfig(response_modalities=['TEXT', 'IMAGE']))
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                image_bytes = BytesIO(part.inline_data.data)
                print("✅ Image generation completed.")
                return {"image_bytes": image_bytes, "project_id": project_id}
        return {"image_bytes": None, "project_id": project_id}
    except Exception as e:
        print(f"❌ Image generation failed: {e}")
        return {"image_bytes": None, "project_id": project_id}

async def image_upload_agent(state: dict) -> dict:
    print("--- Running Image Upload Agent ---")
    image_bytes, project_id, product_name = state.get("image_bytes"), state.get("project_id"), state.get("product_name")
    if not image_bytes or not project_id:
        return {"image_output": None}
    api_url = f"https://genmark-mzoy.onrender.com/api/project/upload-generated-image/{project_id}"
    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        data.add_field(name="image_output", value=image_bytes.getvalue(), filename=f"{product_name}.jpg", content_type="image/jpeg")
        async with session.put(api_url, data=data) as res:
            if res.status == 200:
                print("✅ Image uploaded to server.")
                return {"image_output": f"{product_name}.jpg"}
            else:
                return {"image_output": None}

def video_agent(state: AgentState) -> dict:
    print("--- Running Video Agent ---")
    if not state.get("video_prompt"):
        return {"video_output": None}
    try:
        brand_id, api_key = os.getenv("PREDIS_BRAND_ID"), os.getenv("PREDIS_API_KEY")
        prompt, project_id = state["video_prompt"], state.get("project_id")
        response = requests.post("https://brain.predis.ai/predis_api/v1/create_content/", data={"brand_id": brand_id, "text": prompt, "media_type": "video"}, headers={"Authorization": api_key}, timeout=30)
        response.raise_for_status()
        post_id = response.json().get("post_ids", [None])[0]
        if not post_id: return {"video_output": None}
        for _ in range(15):
            time.sleep(15)
            res = requests.get("https://brain.predis.ai/predis_api/v1/get_posts/", params={"brand_id": brand_id, "media_type": "video", "page_n": 1, "items_n": 5}, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, timeout=20)
            posts = res.json().get("posts", [])
            for post in posts:
                if post["post_id"] == post_id and post["status"] == "completed":
                    video_url = post.get("generated_media", [{}])[0].get("url")
                    if video_url:
                        print("✅ Video generation completed.")
                        upload_res = requests.put(f"https://genmark-mzoy.onrender.com//api/project/upload-generated-video/{project_id}", data={"video_output": video_url}, timeout=10)
                        return {"video_output": video_url}
        return {"video_output": None}
    except Exception as e:
        print(f"❌ Video generation failed: {e}")
        return {"video_output": None}

def router_op(state: AgentState) -> dict:
    print("--- Running Final Router Operation (Sync Point) ---")
    project_id = state.get("project_id")
    try:
        api_url = f"https://genmark-mzoy.onrender.com/api/project/update/generated-output/{project_id}"
        res = requests.put(api_url, data={"project_id": project_id}, timeout=10)
        if res.status_code == 200:
            print("✅ Generated Output Linked to project")
        else:
            print(f"❌ Linking failed: {res.status_code}, {res.text}")
        return {"generationDone": "Generated"}
    except requests.RequestException as e:
        print(f"Linking request failed: {e}")
        return {"generationDone": "Generated"}

def manager_agent(state: AgentState) -> dict:
    print("--- Running Manager Agent ---")
    return {"generationDone": state.get("generationDone", "NotStarted")}

## NEW: Intelligent router for parallel generation
def generation_router(state: AgentState) -> List[str]:
    """
    Inspects the state and decides which generation agents to run based on
    the prompts that were successfully created.
    """
    paths_to_run = []
    print("\n--- Intelligent Generation Router ---")
    
    if state.get("text_prompt"):
        print("🚦 Path selected for: Text Generation")
        paths_to_run.append("text_model")
        
    if state.get("image_prompt"):
        print("🚦 Path selected for: Image Generation")
        paths_to_run.append("image_model")
        
    if state.get("video_prompt"):
        print("🚦 Path selected for: Video Generation")
        paths_to_run.append("video_model")

    if not paths_to_run:
        print("⚠️ No generation paths found. Proceeding to final router.")
        # If no prompts exist, we send it to a non-existent node to join immediately
        # A cleaner way is to just have all conditional paths eventually lead to the join node.
        # LangGraph will proceed to the join node ('router') if no paths are taken.
    
    print(f"🚀 Executing {len(paths_to_run)} branches in parallel...\n")
    return paths_to_run

# --- Graph Definition and Compilation (MODIFIED) ---

# Create the graph
graph = StateGraph(AgentState)

# Define all the nodes
graph.add_node("manager", manager_agent)
graph.add_node("prompt_generator", generate_prompt)
graph.add_node("text_model", text_agent)
graph.add_node("image_model", image_agent) # Note: image_agent is async
graph.add_node("image_upload_agent", image_upload_agent)
graph.add_node("video_model", video_agent)
graph.add_node("router", router_op) # This is our "join" node

# 1. Entry point is the manager
graph.set_entry_point("manager")

# 2. Manager decides the overall flow (same as before)
graph.add_conditional_edges(
    "manager",
    manager_router,
    {
        "generate": "prompt_generator",
        "display": END,
        "edit": END,
        "automate": END,
        "Done": END
    }
)

# 3. After prompts are generated, use the NEW intelligent router to fork
graph.add_conditional_edges(
    "prompt_generator",
    generation_router, # This function decides which branches to run
    # This dictionary is no longer needed in newer LangGraph versions when returning a list of node names.
    # The function itself returns the names of the nodes to call next.
)

# 4. Define the paths for each parallel branch
# The text branch is simple: text_model -> join node
graph.add_edge("text_model", "router")

# The image branch is a sequence: image_model -> image_upload_agent -> join node
graph.add_edge("image_model", "image_upload_agent")
graph.add_edge("image_upload_agent", "router")

# The video branch is simple: video_model -> join node
graph.add_edge("video_model", "router")

# 5. The 'router' node acts as our synchronization point (the "join").
# After it runs, it loops back to the manager to update the status.
graph.add_edge("router", "manager")

# Compile the graph
app = graph.compile()


# --- Main Execution Logic (Unchanged) ---
async def run_langgraph_for_project(project_data: dict):
    """
    Run the LangGraph workflow for a project with proper error handling and timeouts
    """
    try:
        print(f"Starting workflow for project: {project_data.get('project_id')}")
        result = await asyncio.wait_for(
            app.ainvoke(project_data),
            timeout=300  # 5 minutes timeout
        )
        print("\n🎉 Workflow completed successfully! 🎉")
        return result
    except asyncio.TimeoutError:
        print("❌ Workflow timed out after 5 minutes")
        return {"error": "Workflow timeout"}
    except Exception as e:
        print(f"❌ Workflow failed: {e}")
        return {"error": str(e)}