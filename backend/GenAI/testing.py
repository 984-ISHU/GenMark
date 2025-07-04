import time
import requests
import os
from dotenv import load_dotenv

load_dotenv()

def video_agent(state) -> dict:
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
        wait_interval = 10 # seconds
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
        backend_url = f"http://127.0.0.1:8000/api/project/upload-generated-video/{project_id}"
        upload_payload = {"video_output": video_url, "project_id": project_id}

        upload_res = requests.put(backend_url, data=upload_payload, timeout=10)
        if upload_res.status_code == 200:
            print("✅ Video URL uploaded to server")
        else:
            print(f"❌ Upload failed: {upload_res.status_code}, {upload_res.text}")

        return {"video_output": video_url}

    except Exception as e:
        print(f"❌ Video generation failed: {e}")
        return {"video_output": None}


