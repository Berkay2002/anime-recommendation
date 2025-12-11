"""
Google Embeddings Service for generating embeddings using Google's API
Supports both Vertex AI and Google Generative AI (Gemini) embeddings
"""

import os
import time
from typing import List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Configure Google API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

genai.configure(api_key=GOOGLE_API_KEY)

def get_embeddings_batch(texts: List[str], model: str = "models/text-embedding-004", batch_size: int = 100) -> List[List[float]]:
    """
    Generate embeddings for a batch of texts using Google's embedding model.
    
    Args:
        texts: List of text strings to embed
        model: Model name (default: text-embedding-004 which generates 768-dim embeddings)
        batch_size: Number of texts to process at once
        
    Returns:
        List of embedding vectors (768 dimensions each)
    """
    embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1} ({len(batch)} texts)...")
        
        try:
            # Replace empty strings with placeholder to avoid API errors
            processed_batch = [text if text.strip() else "unknown" for text in batch]
            
            # Generate embeddings for the batch
            result = genai.embed_content(
                model=model,
                content=processed_batch,
                task_type="retrieval_document",  # For storing in database
                title=None
            )
            
            # Extract embeddings
            embeddings.extend(result['embedding'])
            
            # Rate limiting - be nice to the API
            time.sleep(0.1)
            
        except Exception as e:
            print(f"Error processing batch: {e}")
            # On error, add zero vectors to maintain alignment
            embeddings.extend([[0.0] * 768 for _ in batch])
    
    return embeddings

def get_single_embedding(text: str, model: str = "models/text-embedding-004", task_type: str = "retrieval_query") -> List[float]:
    """
    Generate embedding for a single text (typically for query/search).
    
    Args:
        text: Text to embed
        model: Model name
        task_type: Either "retrieval_query" for search or "retrieval_document" for storage
        
    Returns:
        Embedding vector (768 dimensions)
    """
    try:
        result = genai.embed_content(
            model=model,
            content=text,
            task_type=task_type
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return [0.0] * 768

def prepare_text_for_embedding(text: Optional[str], max_length: int = 10000) -> str:
    """
    Prepare text for embedding by cleaning and truncating.
    
    Args:
        text: Input text
        max_length: Maximum character length
        
    Returns:
        Cleaned text
    """
    if not text or text == "null" or text == "None":
        return ""
    
    # Truncate if too long
    if len(text) > max_length:
        text = text[:max_length] + "..."
    
    return text.strip()

# Example usage
if __name__ == "__main__":
    # Test the embedding service
    test_texts = [
        "A story about friendship and adventure",
        "Action-packed anime with supernatural powers",
        "Romantic comedy set in high school"
    ]
    
    print("Testing Google Embeddings Service...")
    embeddings = get_embeddings_batch(test_texts)
    
    print(f"Generated {len(embeddings)} embeddings")
    print(f"Embedding dimension: {len(embeddings[0]) if embeddings else 0}")
    print(f"First few values: {embeddings[0][:5] if embeddings else []}")
