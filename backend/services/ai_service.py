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

# ── Load API key from environment (set in backend/.env as GEMINI_API_KEY) ──
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables!")
    raise ValueError(
        "Missing GEMINI_API_KEY in environment variables. "
        "Add it to backend/.env as: GEMINI_API_KEY=your_key_here"
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
    Classify this task for a disaster/NGO scenario. Use the provided context to generate smarter classification and resource planning.

    Task Context:
    - Title: {title}
    - Description: {description}
    - Location: {location}
    - Estimated People Affected: {people_count}
    - Urgency Hint: {urgency_hint}

    Return STRICT JSON ONLY. No markdown formatting. No explanations.
    {{
      "problem": "short summary of the problem based on title and description",
      "category": "food | medical | education | logistics | other",
      "priority": "low | medium | high",
      "resources_required": ["food", "medicine"],
      "skills_required": ["first_aid", "cooking"]
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
            "category": "other",
            "priority": "medium",
            "resources_required": [],
            "skills_required": []
        }