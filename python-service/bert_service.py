from transformers import BertTokenizer, BertModel
import torch

# Load the tokenizer and model once, at the module level
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# Assume CUDA is available and move the model to GPU
device = torch.device('cuda')
model.to(device)

def get_embedding(text):
    # Tokenize and get model outputs
    inputs = tokenizer(text, return_tensors='pt').to(device)
    outputs = model(**inputs)
    
    # Get the embeddings from the last hidden state
    embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().detach().cpu().numpy()
    return embeddings
