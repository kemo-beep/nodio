# Whisper Transcription Server

A local FastAPI server for transcribing audio files using OpenAI's Whisper model.

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Note:** This will download the Whisper model (base) on first run, which is about ~150MB.

### 2. Start the Server

```bash
python server.py
```

The server will start on `http://localhost:8000`

### 3. Test the Server

Check if it's running:

```bash
curl http://localhost:8000/health
```

Test transcription:

```bash
curl -X POST http://localhost:8000/transcribe \
  -F "file=@path/to/your/audio.m4a"
```

## Configuration

### Change Whisper Model

Edit `server.py` and change:

```python
model = whisper.load_model("base")  # Options: tiny, base, small, medium, large
```

Model sizes:

- `tiny` - Fastest, least accurate (~39M parameters)
- `base` - Good balance (default, ~74M parameters)
- `small` - Better accuracy (~244M parameters)
- `medium` - High accuracy (~769M parameters)
- `large` - Best accuracy (~1550M parameters)

### Change Port

Edit the last line in `server.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8000)  # Change 8000 to your preferred port
```

## Mobile App Configuration

In your Expo app's `.env` file:

```env
EXPO_PUBLIC_WHISPER_SERVER_URL=http://localhost:8000
EXPO_PUBLIC_TRANSCRIPTION_PROVIDER=local
```

**For physical devices:** Use your computer's local IP address:

```env
EXPO_PUBLIC_WHISPER_SERVER_URL=http://192.168.1.100:8000
```

Find your IP:

- **macOS/Linux:** `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** `ipconfig` (look for IPv4 Address)

## API Endpoints

- `GET /` - Server status
- `GET /health` - Health check
- `POST /transcribe` - Main transcription endpoint
- `POST /api/transcribe` - Alias for /transcribe
- `POST /whisper/transcribe` - Alternative endpoint
- `POST /v1/audio/transcriptions` - OpenAI-compatible format

All POST endpoints accept:

- `file`: Audio file (multipart/form-data)
- Returns: `{"text": "...", "transcript": "...", "language": "en"}`

## Troubleshooting

### Model Download Issues

If the model fails to download, you can manually download it:

```python
import whisper
whisper.load_model("base", download_root="./models")
```

### Port Already in Use

If port 8000 is already in use, change the port in `server.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Use different port
```

### CORS Issues

The server is configured to allow all origins. For production, update the CORS settings in `server.py`:

```python
allow_origins=["http://localhost:8081", "exp://your-app-url"]
```

### Performance

- First transcription may be slower (model initialization)
- Larger models are more accurate but slower
- Consider using `base` or `small` for real-time use
