1. 🧭 Initial Interaction (index.html)
Upon visiting index.html, users are presented with two primary actions:

📍 Send My Location
Initializes navigation by capturing the user's current GPS coordinates.
Triggers the backend (server.js) to calculate and guide the user to the two nearest unvisited landmarks, using real-time geospatial logic.

📸 Open Camera
Activates the webcam to capture images of landmarks.
The captured image is sent to the backend for landmark classification and description retrieval.

2. 📡 Location-Based Navigation (Persistent Session)
Once a location is submitted:

Haversine Distance Calculation
Computes the distance between user coordinates and each known landmark.

Visited Landmark Tracking
A global visited object in server.js tracks which landmarks the user has visited.

Nearest Landmark Selection
Filters out visited landmarks, sorts remaining ones by distance, and selects the two nearest for navigation.

Audio Navigation Instructions
Directions and landmark names are converted to speech using audio_conversion.py (Google Text-to-Speech), and served as .mp3 files.

3. 🧠 Image-Based Landmark Recognition (model_1.py)
When the user captures or uploads an image:

API Endpoint:
index.html sends the image to /classify-image endpoint.

Deep Learning Pipeline:
a. Image Enhancement & Preprocessing

Resize image, enhance contrast, apply Gaussian blur.

Normalize and reshape to 224x224 pixels for model input.

b. Landmark Classification

Uses a fine-tuned MobileNetV2 CNN to classify 8 campus landmarks.

Outputs a prediction with a confidence score.

c. OCR Fallback

If confidence < 60%, uses Tesseract OCR to extract textual hints from the image.

d. Description Retrieval

Fetches details from landmarks2.json based on predicted label.

e. Audio Generation

Converts the prediction or navigation instruction into an .mp3 file using Google TTS.

Response JSON:
![image](https://github.com/user-attachments/assets/172ce9dc-5077-4264-9918-5509e15d77f4)
4. 🌐 AR Display Interface (ar.html)
This interface is designed for smart glasses (e.g. Vuzix), providing hands-free, real-time feedback:

Continuous Polling
ar.html polls /current-label to fetch the latest landmark prediction and description.

Synchronized Updates
Every new prediction on index.html automatically reflects on ar.html, so users wearing glasses see the same update instantly.

Minimalist Display
Focuses on essential information (label + description), optimized for AR readability.

🧩 Technical Highlights
🎯 Dual Modality Output
Visual + audio feedback for enhanced accessibility and user experience.

🧠 Hybrid Recognition Logic
Combines deep learning and OCR to handle diverse real-world inputs.

⚡ Performance Optimizations
Image preprocessing ensures fast, accurate model inference.

📍 Location-Aware Guidance
Real-time navigation powered by Haversine distance calculations.

🛠 Modular Architecture

File	Purpose
index.html	Main user interface for interaction and image capture
ar.html	AR smart glasses interface
server.js	Backend logic for routing, GPS handling, landmark tracking, audio streaming
model_1.py	Deep learning model for landmark classification
audio_conversion.py	Text-to-speech conversion via Google TTS
landmarks2.json	Landmark metadata and descriptions

🕶 AR-Ready by Design
Clean, reactive, and low-latency interface tailored for augmented reality environments
