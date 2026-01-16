import os
import requests
from typing import List

# Hugging Face Inference API Configuration
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"

def embed_text(text: str) -> List[float]:
    """
    Generate embeddings using Hugging Face Inference API.
    Falls back to zero vector if API fails (for graceful degradation).
    """
    if not HF_API_TOKEN:
        raise ValueError("HF_API_TOKEN environment variable is not set")
    
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    
    try:
        response = requests.post(
            HF_API_URL,
            headers=headers,
            json={"inputs": text, "options": {"wait_for_model": True}}
        )
        response.raise_for_status()
        
        # The API returns a list of embeddings (one per input)
        embeddings = response.json()
        
        # Handle different response formats
        if isinstance(embeddings, list) and len(embeddings) > 0:
            # If it's a nested list, take the first element
            if isinstance(embeddings[0], list):
                return embeddings[0]
            return embeddings
        
        raise ValueError(f"Unexpected API response format: {embeddings}")
        
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        # Return a zero vector as fallback (384 dimensions for all-MiniLM-L6-v2)
        return [0.0] * 384
