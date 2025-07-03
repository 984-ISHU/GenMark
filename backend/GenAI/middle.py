import aiohttp
import os
import requests
import json
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, List, Annotated, Dict
from langgraph.channels import LastValue
from dotenv import load_dotenv
from io import BytesIO
from google import genai as gai
from google.genai import types
from IPython.display import display
from pprint import pprint
import asyncio

load_dotenv()

GROQ_API = os.getenv("GROQ_API")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# You should configure your API key outside the function (only once)
client = gai.Client(api_key=GOOGLE_API_KEY)

class AgentState(TypedDict):
    user_id: str
    project_id: str
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
    generationDone: str
    generated_outputs_id: str
    automate_campaign: Optional[bool]
    
    text_prompt: str
    image_prompt: str
    video_prompt: str

    text_output: Annotated[Optional[str], LastValue(Optional[str])]
    image_output: Annotated[Optional[str], LastValue(Optional[str])]
    video_output: Annotated[Optional[str], LastValue(Optional[str])]

    image_bytes: Optional[BytesIO]  # 👈 ADD THIS LINE


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
    # Extract relevant fields from state
    product_name = state.get("product_name", "")
    description = state.get("description", "")
    discount = state.get("discount", 0.0)
    target_audience = state.get("target_audience", "")
    output_format = state.get("output_format", "")

    # Enhanced system prompt
    system_prompt = (
        "You are an expert prompt engineer.\n"
        "Based on the marketing content provided by the user, your job is to generate highly effective generation prompts for a multimodal LLMs.\n"
        "You must:\n"
        "- Determine what the user wants based on their output format description.\n"
        "- Generate prompts for text, image, and video accordingly.\n"
        "- All prompts should reflect the tone, platform, and audience expectations.\n"
        "- Do not add your own assumptions — follow the user description strictly.\n"
        "- Return a JSON response with only relevant fields filled.\n\n"
        "Only return:\n"
        "{\n"
        "  \"text_prompt\": \"...\" or null,\n"
        "  \"image_prompt\": \"...\" or null,\n"
        "  \"video_prompt\": \"...\" or null\n"
        "}"
    )

    # Build user context message
    user_message = (
        f"Product Name: {product_name}\n"
        f"Description: {description}\n"
        f"Discount: {discount}% off\n"
        f"Target Audience: {target_audience}\n"
        f"Desired Output Format: {output_format}\n\n"
        f"Generate highly effective prompts suitable for generating this kind of content."
    )

    data = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "model": "llama-3.1-8b-instant",
        "temperature": 0.7
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API}",
        "Content-Type": "application/json"
    }

    prompts = {
        "text_prompt": None,
        "image_prompt": None,
        "video_prompt": None,
    }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=15
        )
        response.raise_for_status()
        try:
            result = response.json()["choices"][0]["message"]["content"]
            prompts = json.loads(result)
            print("Generated prompts:")
            pprint(prompts)
        except Exception as e:
            print("Groq response parsing failed:", e)
            print("Raw response:", response.text)
            raise

    except Exception as e:
        print("Prompt generation failed:", e)

    return {
        "text_prompt": prompts.get("text_prompt"),
        "image_prompt": prompts.get("image_prompt"),
        "video_prompt": prompts.get("video_prompt"),
    }


def text_agent(state: AgentState) -> dict:
    """
    Helps to Generate Text output i.e. marketing text based on the prompt provided by the prompt generator
    """

    print("Inside Text Generator")

    if not state.get("text_prompt"):
        print("No text prompt found, skipping text generation")
        return {"text_output": None}

    # Retrieve the prompt
    text_prompt = state.get("text_prompt", "")
    project_id = state.get("project_id", "")

    # Define system instructions
    system_prompt = (
        "You are a senior marketing copywriter for a global brand.\n"
        "Your task is to generate short, compelling marketing messages based on a given prompt.\n"
        "The response must:\n"
        "- Be persuasive and engaging.\n"
        "- Reflect modern, brand-aware language.\n"
        "- Be clear and emotionally resonant for the target audience.\n"
        "- Not exceed 2 paragraphs.\n"
        "- Be ready to publish without further editing."
    )

    try:
        # Generate the text using Gemini
        print("Generating Text...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            ),
            contents=text_prompt
        )
        print("Text generation completed")
        generated_text = response.text.strip()

        print("Generated Text:\n", generated_text)

        # Upload to FastAPI endpoint
        api_url = f"http://127.0.0.1:8000/api/project/upload-generated-text/{project_id}"

        try:
            res = requests.put(
                api_url,
                data={"text": generated_text},
                timeout=10
            )

            if res.status_code == 200:
                print("✅ Text uploaded to server")
            else:
                print(f"❌ Upload failed: {res.status_code}, {res.text}")
        except requests.RequestException as upload_error:
            print(f"❌ Upload request failed: {upload_error}")

        return {"text_output": generated_text}

    except Exception as e:
        print(f"Text generation failed: {e}")
        return {"text_output": None}



async def image_agent(state: AgentState) -> dict:
    """
    Helps to generate images based on the prompt provided by the prompt generator
    """

    print("Inside Image Generator")

    if not state.get("image_prompt"):
        print("No image prompt found, skipping image generation")
        return {"image_bytes": None, "project_id": state.get("project_id")}

    prompt = state["image_prompt"]
    project_id = state.get("project_id")
    print(f"Got project id: {project_id}")

    try:
        print("Generating Image...")
        response = client.models.generate_content(
            model="gemini-2.0-flash-preview-image-generation",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE']
            )
        )
        print("Image generation completed")

        # Extract inline image bytes from first image part
        for i, part in enumerate(response.candidates[0].content.parts):
            print(f"Processing part {i}")
            if part.inline_data is not None:
                print(f"Found inline data in part {i}")
                image_bytes = BytesIO(part.inline_data.data)
                image_bytes.seek(0)
                print(f"Returning image_bytes: {image_bytes is not None}")
                return {"image_bytes": image_bytes, "project_id": project_id}
            else:
                print(f"Part {i} has no inline data")

        print("No valid image part found")
        return {"image_bytes": None, "project_id": project_id}

    except Exception as e:
        print(f"❌ Image generation failed: {e}")
        return {"image_bytes": None, "project_id": project_id}

# ----- IMAGE UPLOAD AGENT -----



async def image_upload_agent(state: dict) -> dict:
    """
    Helps to upload the generated image to the database
    """
    print("Inside Image Upload Agent")
    image_bytes: Optional[BytesIO] = state.get("image_bytes")
    project_id = state.get("project_id")

    if not image_bytes or not project_id:
        print("No image data or project ID, skipping upload")
        return {"image_output": None}

    try:
        api_url = f"http://127.0.0.1:8000/api/project/upload-generated-image/{project_id}"
        print(f"Uploading to: {api_url}")

        async with aiohttp.ClientSession() as session:
            data = aiohttp.FormData()
            data.add_field(
                name="image_output",
                value=image_bytes.getvalue(),
                filename="generated.jpg",
                content_type="image/jpeg"
            )
            async with session.put(api_url, data=data) as res:
                text = await res.text()
                if res.status == 200:
                    print("✅ Image uploaded to server")
                    return {"image_output": "generated.jpg"}
                else:
                    print(f"❌ Upload failed: {res.status}, {text}")
                    return {"image_output": None}

    except Exception as e:
        print(f"❌ Upload request failed: {e}")
        return {"image_output": None}


def video_agent(state: AgentState) -> dict:
    """
    Helps to generate video based on the prompt provided by the prompt generator
    """
    print("Inside Video Generator")
    
    if not state.get("video_prompt"):
        print("No video prompt found, skipping video generation")
        return {"video_output": None}
    
    # For now, return None since video generation isn't implemented
    print("Video generation not implemented yet")
    return {"video_output": None}


def router_op(state: AgentState) -> dict:
    """
    Helps to link the stored image, text and video output to the project by storing generated output id in the project
    """
    print("Inside Router Operation")
    project_id = state.get("project_id")

    try:
        api_url = f"http://127.0.0.1:8000/api/project/update/generated-output/{project_id}"
        res = requests.put(
            api_url, 
            data={"project_id": project_id},
            timeout=10
        )

        if res.status_code == 200:
            print("✅ Generated Output Linked to project")
            return {"generationDone": "Generated"}
        else:
            print(f"❌ Linking failed: {res.status_code}, {res.text}")
            return {"generationDone": "Generated"}  # Continue anyway

    except requests.RequestException as e:
        print(f"Linking request failed: {e}")
        return {"generationDone": "Generated"}  # Continue anyway


def manager_agent(state: AgentState) -> dict:
    """
    Helps to decide whether to generate or not
    """
    print("Inside Manager Agent")
    current_status = state.get("generationDone", "NotStarted")
    print(f"Current generation status: {current_status}")
    return {"generationDone": current_status}


# Create the graph
graph = StateGraph(AgentState)

# Define agents
graph.add_node("manager", manager_agent)
graph.add_node("image_upload_agent", image_upload_agent)
graph.add_node("prompt_generator", generate_prompt)
graph.add_node("text_model", text_agent)
graph.add_node("image_model", image_agent, is_async=True)
graph.add_node("video_model", video_agent)
graph.add_node("router", router_op)

# Entry point
graph.set_entry_point("manager")

# Manager branching
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

# Sequential execution instead of parallel to avoid hanging
graph.add_edge("prompt_generator", "text_model")
graph.add_edge("text_model", "image_model")
graph.add_edge("image_model", "image_upload_agent")
graph.add_edge("image_upload_agent", "video_model")

# Only video_model routes to router
graph.add_edge("video_model", "router")

# Router loops back to manager
graph.add_edge("router", "manager")

# Compile graph
app = graph.compile()


async def run_langgraph_for_project(project_data: dict):
    """
    Run the LangGraph workflow for a project with proper error handling and timeouts
    """
    try:
        print(f"Starting workflow for project: {project_data.get('project_id')}")
        
        # Add timeout to prevent hanging
        result = await asyncio.wait_for(
            app.ainvoke(project_data), 
            timeout=300  # 5 minutes timeout
        )
        
        print("Workflow completed successfully")
        return result
        
    except asyncio.TimeoutError:
        print("❌ Workflow timed out after 5 minutes")
        return {"error": "Workflow timeout"}
    except Exception as e:
        print(f"❌ Workflow failed: {e}")
        return {"error": str(e)}