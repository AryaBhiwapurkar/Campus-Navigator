from gtts import gTTS
import uuid
import os
import sys

def generate_audio(instruction_text):
    """Converts instruction text to MP3 audio and returns file path."""
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join("static", filename)

    tts = gTTS(text=instruction_text, lang='en')
    tts.save(filepath)

    return filepath  # This will be like 'static/audio_xxx.mp3'

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No instruction text provided.")
        sys.exit(1)
    instruction = sys.argv[1]  # Get text passed from Node.js
    path = generate_audio(instruction)
    print(path)
