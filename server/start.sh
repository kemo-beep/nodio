#!/bin/bash

# Start Whisper Server

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start the server
echo "🚀 Starting Whisper Transcription Server..."
echo "📍 Server will be available at http://localhost:8000"
echo ""
python server.py

