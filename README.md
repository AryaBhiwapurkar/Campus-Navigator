# Campus-Navigator
🔁 User Flow & System Pipeline
This project enables real-time landmark recognition and navigation guidance using computer vision, OCR, and geospatial logic. It supports both standard web interfaces and AR smart glasses. Below is a breakdown of the system architecture and interaction flow:

1. 🧭 Initial Interaction: index.html
Upon launching the application through index.html, users are presented with two primary actions:

📍 "Send My Location": This one-time action initializes the navigation session by capturing the user's current GPS coordinates. It triggers server-side logic to continuously guide the user through nearby unvisited landmarks.

📸 "Open Camera": Launches the webcam interface, allowing users to capture images of landmarks in real-time. The image is sent to the backend for landmark classification and information retrieval.

2. 📡 Location-Based Navigation (Persistent Session)
Once the user's location is submitted, the server (via server.js) activates a navigation system powered by:

Haversine Distance Calculation: Computes distance between user coordinates and all known landmark GPS coordinates.

Visited Landmark Tracking: A global visited object keeps track of user progress through the tour.

Nearest Landmark Selection: Filters out visited landmarks, sorts the rest by distance, and selects the two nearest unvisited landmarks.

Audio Navigation Instructions: Text-to-speech prompts are generated dynamically using audio_conversion.py and returned as .mp3 files for playback.

3. 🧠 Image-Based Landmark Recognition (model_1.py)
When the user captures or uploads an image:

The frontend (index.html) sends the image to the /classify-image endpoint.

The backend (model_1.py) performs a deep learning classification pipeline, including:

a. Image Enhancement & Preprocessing

Resize, enhance contrast, apply Gaussian blur.

Normalize and reshape image to 224x224 pixels for model input.

b. Landmark Classification

Uses a fine-tuned MobileNetV2 CNN model to classify 8 campus landmarks.

Outputs prediction with confidence score.

c. OCR Fallback

If confidence is below 60%, Tesseract OCR scans image text for landmark names as a backup detection method.

d. Description Retrieval

Fetches landmark metadata from landmarks2.json.

e. Audio Generation

Uses Google Text-to-Speech (gTTS) to convert text to audio.

Resulting .mp3 file is served via /audio/:filename.

JSON response includes:

label: Predicted landmark

description: Informative text

confidence: Prediction confidence

audioUrl: Path to the generated audio file

4. 🌐 AR Display Interface: ar.html
The AR interface is optimized for wearable smart glasses (e.g. Vuzix) and presents landmark information in real time:

Polling Mechanism: ar.html continuously polls /current-label to check for new predictions.

Sync with index.html: Any successful prediction update from the image classification on index.html instantly updates the AR view.

Minimalist UI: Presents only the landmark label and its description — perfect for glanceable, distraction-free viewing.

🧩 Technical Highlights
Dual Modality Output: Combines visual display + audio narration for improved accessibility.

Hybrid Recognition: CNN-based classification with OCR fallback ensures robustness in real-world scenarios.

Optimized Preprocessing: Reduces latency while maintaining model accuracy.

Location-Aware Navigation: Real-time GPS-based guidance using Haversine logic.

Modular Architecture:

index.html: Main user interface

ar.html: AR glasses interface

server.js: Express backend handling classification, location logic, and audio generation

model_1.py: Deep learning inference logic

audio_conversion.py: Text-to-speech engine

AR-Ready: Built with smart glasses integration in mind — clean, reactive, and low-latency.
