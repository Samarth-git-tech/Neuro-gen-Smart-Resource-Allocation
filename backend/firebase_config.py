import firebase_admin
from firebase_admin import credentials
import os
import logging

logger = logging.getLogger(__name__)

def initialize_firebase():
    """Initialize Firebase Admin SDK cleanly and exactly once."""
    if not firebase_admin._apps:
        cred_path = "firebase_key.json"
        
        if not os.path.exists(cred_path):
            raise FileNotFoundError(f"Firebase Service Account JSON not found at: {cred_path}")
            
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")

initialize_firebase()
