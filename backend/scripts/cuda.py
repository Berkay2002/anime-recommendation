import torch

# Check if CUDA is available
print("CUDA available:", torch.cuda.is_available())

# Check CUDA device details
if torch.cuda.is_available():
    print("CUDA device count:", torch.cuda.device_count())
    print("Current CUDA device:", torch.cuda.current_device())
    print("Device name:", torch.cuda.get_device_name(torch.cuda.current_device()))
else:
    print("CUDA is not available. Please check installation.")
