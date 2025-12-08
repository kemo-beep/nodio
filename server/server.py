from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Whisper Transcription Server", version="1.0.0")

# Enable CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (load once at startup)
logger.info("Loading Whisper model...")
try:
    model = whisper.load_model("base")
    logger.info("Whisper model loaded successfully!")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {e}")
    model = None

@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Whisper Transcription Server",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file using Whisper.
    Accepts audio files in various formats (m4a, mp3, wav, etc.)
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Whisper model not loaded")
    
    tmp_path = None
    try:
        # Determine file extension from content type or filename
        file_ext = ".m4a"  # default
        if file.filename:
            file_ext = os.path.splitext(file.filename)[1] or ".m4a"
        elif file.content_type:
            # Map content types to extensions
            content_type_map = {
                "audio/mpeg": ".mp3",
                "audio/wav": ".wav",
                "audio/m4a": ".m4a",
                "audio/mp4": ".mp4",
                "audio/ogg": ".ogg",
            }
            file_ext = content_type_map.get(file.content_type, ".m4a")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        logger.info(f"Transcribing file: {file.filename or 'unknown'} ({len(content)} bytes)")
        
        # Transcribe
        result = model.transcribe(tmp_path, language="en", fp16=False)
        transcript = result["text"].strip()
        
        logger.info(f"Transcription completed: {len(transcript)} characters")
        
        return {
            "text": transcript,
            "transcript": transcript,
            "language": result.get("language", "en")
        }
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Clean up temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")

@app.post("/api/transcribe")
async def transcribe_audio_api(file: UploadFile = File(...)):
    """Alias for /transcribe endpoint"""
    return await transcribe_audio(file)

@app.post("/whisper/transcribe")
async def transcribe_whisper(file: UploadFile = File(...)):
    """Alternative endpoint path"""
    return await transcribe_audio(file)

@app.post("/v1/audio/transcriptions")
async def transcribe_openai_format(file: UploadFile = File(...)):
    """OpenAI-compatible endpoint format"""
    result = await transcribe_audio(file)
    # Return just the text for OpenAI format compatibility
    return result["text"]

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Whisper Transcription Server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

