from transformers import BertTokenizer, BertModel
import torch

# Load the tokenizer and model once, at the module level
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# Check if CUDA is available and set the device accordingly
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)
model.eval()  # Set the model to evaluation mode

def get_embeddings(texts, batch_size=8):
    """
    Generates BERT embeddings for a list of texts in batches.

    Args:
    - texts (list of str): List of input texts.
    - batch_size (int): Number of texts to process at once.

    Returns:
    - list of np.ndarray: List of embeddings for each input text.
    """
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        
        # Tokenize and move inputs to the device
        inputs = tokenizer(batch_texts, return_tensors='pt', truncation=True, padding=True).to(device)
        
        # Generate embeddings in inference mode (no gradients needed)
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Mean-pool the embeddings from the last hidden state
        batch_embeddings = outputs.last_hidden_state.mean(dim=1).detach().cpu().numpy()
        all_embeddings.extend(batch_embeddings)
    
    return all_embeddings
