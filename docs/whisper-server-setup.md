# Whisper Server Setup Guide

This guide shows you how to set up a local Whisper server for transcription instead of using OpenAI API.

## Option 1: WhisperLiveKit (Recommended)

WhisperLiveKit is a real-time transcription server that runs locally.

### Installation

```bash
pip install whisperlivekit
```

### Start the Server

```bash
wlk --model base --language en --port 8000
```

The server will be available at `http://localhost:8000`

### Configure the App

In your `.env` file:

```env
EXPO_PUBLIC_WHISPER_SERVER_URL=http://localhost:8000
EXPO_PUBLIC_TRANSCRIPTION_PROVIDER=local
```

**Note:** For mobile devices, you'll need to use your computer's local IP address instead of `localhost`. Find your IP:

- **macOS/Linux:** `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** `ipconfig` (look for IPv4 Address)

Then use: `EXPO_PUBLIC_WHISPER_SERVER_URL=http://YOUR_IP:8000`

## Option 2: Simple FastAPI Whisper Server

Create a simple backend server using FastAPI and Whisper.

### Installation

```bash
pip install fastapi uvicorn whisper python-multipart
```

### Server Code (`server.py`)

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import whisper
import io
import tempfile
import os

app = FastAPI()

# Enable CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (load once at startup)
model = whisper.load_model("base")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Transcribe
        result = model.transcribe(tmp_path, language="en")
        transcript = result["text"]

        # Clean up
        os.unlink(tmp_path)

        return {"text": transcript, "transcript": transcript}
    except Exception as e:
        return {"error": str(e)}, 500

@app.post("/api/transcribe")
async def transcribe_audio_api(file: UploadFile = File(...)):
    return await transcribe_audio(file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Start the Server

```bash
python server.py
```

### Configure the App

Same as Option 1 - set `EXPO_PUBLIC_WHISPER_SERVER_URL` in your `.env` file.

## Option 3: Use OpenAI API (Fallback)

If you prefer to use OpenAI's API:

```env
EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here
EXPO_PUBLIC_TRANSCRIPTION_PROVIDER=openai
```

## Configuration Options

### Environment Variables

- `EXPO_PUBLIC_WHISPER_SERVER_URL` - URL of your local Whisper server (e.g., `http://localhost:8000` or `http://192.168.1.100:8000`)
- `EXPO_PUBLIC_TRANSCRIPTION_PROVIDER` - Provider preference: `local`, `openai`, or `auto` (default: `auto`)
- `EXPO_PUBLIC_OPENAI_API_KEY` - OpenAI API key (optional, used as fallback)

### Provider Selection Logic

- `local`: Always use local server
- `openai`: Always use OpenAI API
- `auto`: Try local server first, fallback to OpenAI if local fails

## Testing Your Server

You can test if your server is working by making a curl request:

```bash
curl -X POST http://localhost:8000/transcribe \
  -F "file=@path/to/your/audio.m4a"
```

## Troubleshooting

### Mobile Device Can't Connect

- Make sure your phone and computer are on the same WiFi network
- Use your computer's local IP address, not `localhost`
- Check firewall settings - port 8000 must be open
- For iOS Simulator, `localhost` works fine

### Server Not Responding

- Check if the server is running: `curl http://localhost:8000/transcribe`
- Check server logs for errors
- Make sure Whisper model is downloaded (first run will download automatically)

### CORS Errors

- Make sure your server has CORS middleware enabled (see FastAPI example above)
- For WhisperLiveKit, check if it supports CORS or needs configuration
