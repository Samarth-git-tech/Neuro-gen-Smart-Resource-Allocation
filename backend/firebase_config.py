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
            cred_path = "firebase_key.json"
            if not os.path.exists(cred_path):
                raise FileNotFoundError("Firebase Service Account JSON not found, and FIREBASE_CREDENTIALS env var is missing.")
            cred = credentials.Certificate(cred_path)
            
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")

initialize_firebase()
