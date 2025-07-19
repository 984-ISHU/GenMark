import os
import sys  # Import sys to exit gracefully
import asyncio
import argparse
from io import BytesIO
from typing import List
from datetime import datetime

from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

# --- Environment and API Setup ---
load_dotenv()

# We check for the library and configuration here.
try:
    from google.generativeai.types import Part, Content
    from google import genai as gai
    
    # Check if the API key exists before trying to configure
    if not os.getenv("GOOGLE_API_KEY"):
        print("❌ GOOGLE_API_KEY not found in your .env file. Please add it.")
        gai = None
    else:
        gai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

except ImportError:
    print("❌ The 'google-generativeai' library is not installed.")
    print("   Please install it by running: pip install google-generativeai")
    gai = None

# --- TOOLS: Modified for Local I/O ---

@tool
async def generate_marketing_text(
    product_name: str,
    description: str,
    target_audience: str,
    platform: str
) -> str:
    """
    Generates compelling marketing copy for a product.

    Args:
        product_name: The name of the product.
        description: A brief description of the product.
        target_audience: The intended audience for the marketing copy.
        platform: The social media platform (e.g., 'Instagram', 'TikTok', 'Twitter').
    """
    print(f"🛠️ TOOL: Generating text for '{product_name}' on {platform}...")
    prompt = (
        f"Create a short, energetic, and persuasive marketing caption for an {platform} post. "
        f"The post is for a product named '{product_name}'.\n"
        f"Description: {description}\n"
        f"Target Audience: {target_audience}\n"
        "The caption should be final, ready-to-publish text in 1-2 paragraphs."
    )
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
    response = await llm.ainvoke(prompt)
    generated_text = response.content.strip()
    
    return f"--- Generated Marketing Text ---\n{generated_text}"

@tool
async def generate_marketing_image(
    prompt: str,
    reference_image_paths: List[str]
) -> str:
    """
    Generates a marketing image from a prompt and local reference images, saving the result locally.

    Args:
        prompt: A detailed prompt describing the desired scene, mood, and background.
        reference_image_paths: A list of local file paths for the reference product images.
    """
    # This check is now a secondary safeguard. The main check at startup should prevent this.
    if not gai:
        return "Error: The Google GenAI library is not configured. Cannot generate image."
        
    print(f"🛠️ TOOL: Generating image from local files...")
    
    model_prompt = Part(text=(
        "You are an expert marketing image generator. Faithfully preserve the product's exact appearance "
        "as seen in the uploaded reference image(s). Only generate the background, context, or setting "
        f"based on the following prompt: {prompt}"
    ))
    
    parts = [model_prompt]

    for image_path in reference_image_paths:
        try:
            with open(image_path, "rb") as f:
                image_data = f.read()
                mime_type = f"image/{os.path.splitext(image_path)[-1].strip('.')}"
                parts.append(Part(inline_data={"mime_type": mime_type, "data": image_data}))
                print(f"✅ Loaded reference image: {image_path}")
        except FileNotFoundError:
            return f"Error: Reference image not found at path: {image_path}"

    if len(parts) == 1:
        return "Error: No reference images were successfully loaded."
    
    generation_model = gai.GenerativeModel("gemini-1.5-flash")
    response = await generation_model.generate_content_async(Content(parts=parts))
    
    image_bytes_data = response.candidates[0].content.parts[0].inline_data.data
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"generated_image_{timestamp}.jpg"
    
    with open(output_filename, "wb") as f:
        f.write(image_bytes_data)
        
    return f"✅ Image successfully generated and saved as '{output_filename}'."


# --- Agent Definition ---
tools = [generate_marketing_text, generate_marketing_image]
model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
app = create_react_agent(model, tools)

# --- Planner and Runner ---
def create_prompt_from_cli_args(args: argparse.Namespace) -> str:
    """Translates command-line arguments into a natural language command for the agent."""
    print("🧠 Planner: Translating CLI arguments into a natural language prompt...")
    instruction = (
        f"Execute a marketing campaign for the product '{args.product_name}'.\n"
        f"Description: '{args.description}'.\n"
        f"Target Audience: '{args.target_audience}'.\n"
        f"The desired output format is: '{args.output_format}'.\n"
    )
    if args.ref_images:
        instruction += f"Use the local reference images located at: {args.ref_images}."
    
    return instruction

async def run_agent(user_request: str):
    """Runs the agent with the generated request from the CLI."""
    print(f"\n🚀 Starting Agent with request: '{user_request}'")
    config = {"configurable": {"thread_id": "local-test-thread"}}
    messages = [HumanMessage(content=user_request)]
    
    async for event in app.astream({"messages": messages}, config=config):
        for key, value in event.items():
            if key == "actions":
                for action in value:
                    print(f"--- Agent Action Result ---\n{action.result}\n")
            elif key == "messages" and value[-1].type == 'ai' and not value[-1].tool_calls:
                 print(f"--- Agent Final Response ---\n{value[-1].content}\n")

# --- Main Execution Block with Command-Line Interface ---
async def main():
    # **CRUCIAL CHECK**: Exit immediately if dependencies are not met.
    if gai is None:
        print("\nScript cannot proceed due to missing dependencies or configuration. Please fix the issue above and try again.")
        sys.exit(1) # Exit with a non-zero status code to indicate an error

    parser = argparse.ArgumentParser(description="Run a local marketing agent.")
    parser.add_argument("--product-name", required=True, help="Name of the product.")
    parser.add_argument("--description", required=True, help="Description of the product.")
    parser.add_argument("--target-audience", required=True, help="Target audience for the campaign.")
    parser.add_argument("--output-format", required=True, help="e.g., 'Instagram post with text and image'.")
    parser.add_argument("--ref-images", nargs='*', default=[], help="List of local file paths for reference images.")

    args = parser.parse_args()
    request_prompt = create_prompt_from_cli_args(args)
    await run_agent(request_prompt)

if __name__ == "__main__":
    asyncio.run(main())