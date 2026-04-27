"""
services/ai_service.py
──────────────────────
Gemini AI integration for task classification.
Accepts either a dict (with title, description, etc.) or a plain text string.
Returns a parsed JSON dict.
"""

import os
import json
import re
import logging
from google import genai

logger = logging.getLogger(__name__)

# ── Load API key from environment ──
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not GEMINI_API_KEY:
    logger.error("API key not found in environment variables!")
    raise ValueError(
        "Missing GEMINI_API_KEY or GOOGLE_API_KEY in environment variables. "
        "Add it to backend/.env as: GOOGLE_API_KEY=your_key_here"
    )

client = genai.Client(api_key=GEMINI_API_KEY)

def clean_json(text: str) -> str:
    """Helper to cleanly strip out markdown json block backticks."""
    return re.sub(r"`json|`", "", text).strip()

def analyze_task(task_data) -> dict:
    """
    Classify a task/input using Gemini AI.

    Args:
        task_data: Either a dict with keys (title, description, location, etc.)
                   or a plain text string for quick analysis.

    Returns:
        dict: A parsed JSON dictionary from Gemini's response.
    """

    # ── Normalize input: accept both dict and string ──
    if isinstance(task_data, str):
        # Called from routes/ai.py with raw text
        title = "Community Input"
        description = task_data
        location = "Not provided"
        people_count = 0
        urgency_hint = ""
    elif isinstance(task_data, dict):
        # Called from routes/tasks.py or routes/inputs.py with structured data
        title = task_data.get("title", "")
        description = task_data.get("description", "")
        location = task_data.get("location", "Not provided")
        people_count = task_data.get("people_count", 0)
        urgency_hint = task_data.get("urgency_hint", "")
    else:
        raise TypeError(f"analyze_task expects str or dict, got {type(task_data)}")

    prompt = f"""
    You are an AI assistant for a Disaster Relief NGO. Classify the following task based on the provided context.
    You MUST return ONLY valid JSON. Do not include markdown formatting or explanations.

    Task Context:
    - Title: {title}
    - Description: {description}
    - Location: {location}
    - Estimated People Affected: {people_count}
    - Urgency Hint: {urgency_hint}

    PRIORITY LEVEL CRITERIA:
    - "URGENT": Life-threatening, medical emergencies, active fires, or total lack of water/food in a crisis zone.
    - "HIGH": Significant property damage, medical needs that aren't immediately life-threatening, or blocked access.
    - "MEDIUM": Resource requests (food/blankets) where no immediate danger is present.
    - "LOW": General inquiries or non-critical cleanup.

    CATEGORY CRITERIA:
    Must be exactly one of: "FOOD_WATER", "MEDICAL", "SHELTER", "RESCUE", "LOGISTICS", "OTHER".
    Only use "OTHER" if it truly doesn't fit the main categories.

    ---
    EXAMPLES:

    Input: Title="Need immediate medical help", Description="Someone is bleeding heavily after a building collapse."
    Output: {{"problem": "Severe bleeding injury", "category": "MEDICAL", "priority": "URGENT", "resources_required": ["first_aid_kit", "ambulance"], "skills_required": ["medical_professional"]}}

    Input: Title="Road blocked by fallen tree", Description="We can't get vehicles through the main street."
    Output: {{"problem": "Road blocked by debris", "category": "LOGISTICS", "priority": "HIGH", "resources_required": ["chainsaw", "heavy_machinery"], "skills_required": ["heavy_equipment_operation"]}}

    Input: Title="Need blankets for the night", Description="It is getting cold and we have 10 people without warm clothes."
    Output: {{"problem": "Lack of warm clothing", "category": "SHELTER", "priority": "MEDIUM", "resources_required": ["blankets", "warm_clothes"], "skills_required": []}}
    ---

    Output JSON structure:
    {{
      "problem": "short summary of the problem based on title and description",
      "category": "FOOD_WATER | MEDICAL | SHELTER | RESCUE | LOGISTICS | OTHER",
      "priority": "URGENT | HIGH | MEDIUM | LOW",
      "resources_required": ["list of strings"],
      "skills_required": ["list of strings"]
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        # Clean potential markdown wrapping
        cleaned = clean_json(response.text)
        
        # Safely parse JSON result
        parsed_data = json.loads(cleaned)
        return parsed_data
        
    except Exception as e:
        logger.error(f"AI Service Error during analyze_task: {e}")
        
        # Return fallback safe response dict
        return {
            "problem": description[:50] if description else "Unknown issue",
            "category": "OTHER",
            "priority": "MEDIUM",
            "resources_required": [],
            "skills_required": []
        }