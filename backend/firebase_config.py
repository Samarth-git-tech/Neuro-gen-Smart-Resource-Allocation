import firebase_admin
from firebase_admin import credentials
import os
import logging

logger = logging.getLogger(__name__)

import json

def initialize_firebase():
    """Initialize Firebase Admin SDK cleanly and exactly once."""
    if not firebase_admin._apps:
        firebase_creds = os.getenv("FIREBASE_CREDENTIALS")
        if firebase_creds:
            cred_dict = json.loads(firebase_creds)
            cred = credentials.Certificate(cred_dict)
        else:
            cred_path = os.path.join(os.path.dirname(__file__), "firebase_key.json")
            if not os.path.exists(cred_path):
                raise FileNotFoundError(
                    "firebase_key.json not found AND FIREBASE_CREDENTIALS env var is not set. "
                    "On Railway: add FIREBASE_CREDENTIALS as an env variable containing the full JSON content."
                )
            cred = credentials.Certificate(cred_path)

        # ── Both lines are INSIDE the if block (only runs once) ──
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
    else:
        logger.info("Firebase Admin SDK already initialized — skipping.")

initialize_firebase()
