#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p data

# Remove existing virtual environment if it exists
if [ -d "venv" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements-py312.txt

# Run the application
echo "Starting the server..."
python backend/server.py