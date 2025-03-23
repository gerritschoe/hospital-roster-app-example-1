#!/bin/bash

# Check if Python 3.10 is available
if ! command -v python3.10 &> /dev/null
then
    echo "Python 3.10 is not installed. Please install it first."
    echo "You can install it using pyenv or the official installer from python.org"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data

# Remove existing virtual environment if it exists
if [ -d "venv-py310" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv-py310
fi

# Create virtual environment
echo "Creating virtual environment with Python 3.10..."
python3.10 -m venv venv-py310

# Activate virtual environment
source venv-py310/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the application
echo "Starting the server..."
python backend/server.py