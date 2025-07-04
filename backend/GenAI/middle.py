import time
from bson import ObjectId
from app.db import get_database
from google.genai.types import Part, Content, Blob
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
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
        "You help users market their products by generating highly effective generation prompts for a multimodal LLM.\n"
        "Your job is to create prompts that guide the LLM to generate **marketing content** in the form of text, images, and videos.\n\n"
        "Your responsibilities include:\n"
        "- Accurately interpret the user's intent and the desired output format, and generate prompts **only** for the formats requested.\n"
        "- Always generate clear, goal-oriented prompts for **text**, **image**, and **video** when specified.\n"
        "- For the **image prompt**, always assume that one or more reference images of the product are provided.\n"
        "- The image prompt must **explicitly reference the input image(s)** and instruct the image generation agent to retain the **exact visual appearance** of the product as shown — including shape, color, texture, and overall look.\n"
        "- If the user only describes the setting, mood, or environment (and not the product itself), the image prompt must still ensure the product **looks exactly like it does in the input image(s)**. Never modify or reinterpret the product's appearance.\n"
        "- Do not introduce assumptions — strictly follow the user's instructions for tone, platform, and audience.\n"
        "- If the output format is **unclear or ambiguous**, default to generating prompts for **image and text** only (no video).\n"
        "- Return only a clean JSON object, filling relevant fields and setting others to `null`.\n\n"
        "Output format:\n"
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
            timeout=45
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
        api_url = f"https://genmark.onrender.com/api/project/upload-generated-text/{project_id}"

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
    print("Inside Image Generator")

    if not state.get("image_prompt"):
        print("No image prompt found, skipping image generation")
        return {"image_bytes": None, "project_id": state.get("project_id")}

    prompt = state["image_prompt"]
    project_id = state.get("project_id")
    image_ids = state.get("image_ids", [])
    print("Image IDs:", image_ids)

    try:
        db = get_database()
        print("Using database:", db.name)
        collections = await db.list_collection_names()
        print("Collections in DB:", collections)
        await db.command("ping")
        print("Database connection verified")
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="ProductImageBucket")

        parts = []

        # Add the image prompt as the first Part
        parts.append(Part(text=(
            "You are an expert marketing image generator.\n"
            "Always preserve the product's exact appearance as seen in the uploaded image(s).\n"
            "Only generate the background, context, or marketing setting based on the prompt below:\n\n"
            f"{prompt}"
        )))

        # Load images from GridFS
        for image_id in image_ids:
            print(f"Loading image: {image_id}")
            try:
                obj_id = ObjectId(image_id)

                # Check existence in files collection
                file_exists = await db["ProductImageBucket.files"].find_one({"_id": obj_id})
                if not file_exists:
                    print(f"❌ Image ID {image_id} not found in ProductImageBucket.files")
                    continue

                file_obj = await bucket.open_download_stream(obj_id)
                if not file_obj:
                    print(f"❌ GridFS could not open stream for {image_id}")
                    continue

                image_data = await file_obj.read()
                await file_obj.close()

                parts.append(Part(inline_data={
                    "mime_type": "image/jpeg",
                    "data": image_data
                }))
                print(f"✅ Loaded image {image_id}")

            except Exception as e:
                print(f"⚠️ Failed to load image {image_id}: {e}")


        # Construct content from parts
        contents = Content(parts=parts)

        print("Generating Image with prompt and image(s)...")
        response = client.models.generate_content(
            model="gemini-2.0-flash-preview-image-generation",
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE']
            )
        )

        for i, part in enumerate(response.candidates[0].content.parts):
            if part.inline_data:
                image_bytes = BytesIO(part.inline_data.data)
                image_bytes.seek(0)
                print("✅ Image generated successfully")
                return {"image_bytes": image_bytes, "project_id": project_id}

        print("❌ No valid image part found in response")
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
    product_name = state.get("product_name")

    if not image_bytes or not project_id:
        print("No image data or project ID, skipping upload")
        return {"image_output": None}

    try:
        api_url = f"https://genmark.onrender.com/api/project/upload-generated-image/{project_id}"
        print(f"Uploading to: {api_url}")

        async with aiohttp.ClientSession() as session:
            data = aiohttp.FormData()
            data.add_field(
                name="image_output",
                value=image_bytes.getvalue(),
                filename=f"{product_name}.jpg",
                content_type="image/jpeg"
            )
            async with session.put(api_url, data=data) as res:
                text = await res.text()
                if res.status == 200:
                    print("✅ Image uploaded to server")
                    return {"image_output": f"{product_name}.jpg"}
                else:
                    print(f"❌ Upload failed: {res.status}, {text}")
                    return {"image_output": None}

    except Exception as e:
        print(f"❌ Upload request failed: {e}")
        return {"image_output": None}


def video_agent(state: AgentState) -> dict:
    """
    Generates a video via Predis and uploads the video URL to the backend after polling until it's ready.
    """
    print("Inside Video Generator")

    if not state.get("video_prompt"):
        print("No video prompt found, skipping video generation")
        return {"video_output": None}

    try:
        brand_id = os.getenv("PREDIS_BRAND_ID")
        api_key = os.getenv("PREDIS_API_KEY")
        print("Brand ID:", brand_id)
        print("API Key:", api_key)
        prompt = state["video_prompt"]
        project_id = state.get("project_id")

        # Step 1: Trigger video generation
        create_url = "https://brain.predis.ai/predis_api/v1/create_content/"
        create_payload = {
            "brand_id": brand_id,
            "text": prompt,
            "media_type": "video"
        }
        headers = {"Authorization": api_key}

        print("Requesting video generation...")
        response = requests.post(create_url, data=create_payload, headers=headers, timeout=30)
        if response.status_code != 200:
            print(f"❌ Video creation failed: {response.status_code}, {response.text}")
            return {"video_output": None}

        # Extract post_id to track the video status
        res_data = response.json()
        post_id = res_data.get("post_ids", [None])[0]
        if not post_id:
            print("❌ Could not retrieve post ID for video")
            return {"video_output": None}

        print(f"🔁 Waiting for video to be processed (Post ID: {post_id})...")

        # Step 2: Poll the get_posts endpoint until the video is ready
        video_url = None
        max_attempts = 15
        wait_interval = 10  # seconds
        for attempt in range(max_attempts):
            time.sleep(wait_interval)
            get_url = "https://brain.predis.ai/predis_api/v1/get_posts/"
            get_payload = {
                "brand_id": brand_id,
                "media_type": "video",
                "page_n": 1,
                "items_n": 5
            }
            get_headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            res = requests.get(get_url, params=get_payload, headers=get_headers, timeout=20)
            if res.status_code != 200:
                print(f"❌ Failed to fetch posts: {res.status_code}")
                break

            posts = res.json().get("posts", [])
            # Look for the post with matching post_id and status == completed
            for post in posts:
                if post["post_id"] == post_id and post["status"] == "completed":
                    media = post.get("generated_media", [])
                    if media and media[0].get("url"):
                        video_url = media[0]["url"]
                        print(f"✅ Video is ready: {video_url}")
                        break

            if video_url:
                break
            else:
                print(f"⏳ Attempt {attempt+1}/{max_attempts}: Video not ready yet...")

        if not video_url:
            print("❌ Video generation timed out after polling")
            return {"video_output": None}

        # Step 3: Upload the video URL to backend
        backend_url = f"https://genmark.onrender.com/api/project/upload-generated-video/{project_id}"
        upload_payload = {"video_output": video_url}

        upload_res = requests.put(backend_url, data=upload_payload, timeout=10)
        if upload_res.status_code == 200:
            print("✅ Video URL uploaded to server")
        else:
            print(f"❌ Upload failed: {upload_res.status_code}, {upload_res.text}")

        return {"video_output": video_url}

    except Exception as e:
        print(f"❌ Video generation failed: {e}")
        return {"video_output": None}



def router_op(state: AgentState) -> dict:
    """
    Helps to link the stored image, text and video output to the project by storing generated output id in the project
    """
    print("Inside Router Operation")
    project_id = state.get("project_id")

    try:
        api_url = f"https://genmark.onrender.com/api/project/update/generated-output/{project_id}"
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