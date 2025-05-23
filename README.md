🎓** Campus Navigator**
Campus Navigator is a real-time landmark recognition and navigation system for campus environments. It combines computer vision, OCR, geospatial logic, and AR integration to guide users via audio and visual outputs. The app runs on both traditional web interfaces and AR smart glasses.

🔁 User Flow & System Architecture
**1. 🧭 Initial Interaction (index.html)**
    Upon launching the app via index.html, users are presented with two main actions:

a)📍 Send My Location: Captures the user's GPS coordinates (one-time at the start of the session). Triggers navigation logic in server.js to identify the two nearest unvisited landmarks using geospatial calculations.

b) 📸 Open Camera: Launches the device’s webcam for image capture. Captured image is sent to the backend for landmark recognition and description retrieval.
---------------------------------------------------------------------------------------
**2. 📡 Location-Based Navigation (Persistent Session)**
Once location is submitted, a live navigation session begins:

🗺 Haversine Distance Calculation: Calculates distances between the user’s location and all campus landmarks using the Haversine formula.

✅ Visited Landmark Tracking: A global visited object in server.js tracks which landmarks the user has already seen.

📌 Nearest Landmark Selection: Filters out visited landmarks. Sorts remaining landmarks by proximity. Selects the two nearest unvisited landmarks to guide the user.

🔊 Audio Navigation Instructions: Navigation directions are generated using audio_conversion.py (Google Text-to-Speech). Returned to the frontend as .mp3 files for playback.
---------------------------------------------------------------------------------------

**3. 🧠 Image-Based Landmark Recognition (model_1.py)**
When the user captures or uploads a landmark image:

🔁 API Communication: The image is sent from index.html to the /classify-image API endpoint.

🧪 Deep Learning Pipeline
a. Image Preprocessing: Resize and crop image. Enhance contrast and apply Gaussian blur. Normalize and reshape to 224×224 pixels

b. Landmark Classification: Uses a MobileNetV2 model fine-tuned to recognize 8 specific campus landmarks. Outputs a predicted label and confidence score

c. OCR Fallback: If confidence < 60%, applies Tesseract OCR to read text in the image for a possible match

d. Description Retrieval: Fetches detailed info from landmarks2.json based on the detected label

e. Audio Generation: Uses Google TTS to generate speech describing the landmark. Saves the result as an .mp3 and returns the URL

🧾 Example JSON Response
![image](https://github.com/user-attachments/assets/8d7b5d66-b374-46bc-9da9-12a5854e449e)









4. 🌐 AR Display Interface (ar.html)
Designed for smart glasses (e.g., Vuzix), this interface provides hands-free landmark updates:

    📥 Continuous Polling:  ar.html polls the /current-label endpoint to get the latest classification result.

    🔄 Real-Time Sync with index.html: Whenever a new landmark is recognized on index.html, the AR interface is immediately updated.

    🧼 Minimalist UI: Only the landmark label and description are shown — perfect for glanceable, non-intrusive AR display.



🧩 Technical Highlights
Feature	Description
    🎯 Dual Modality Output Combines image-based text and audio narration
    🧠 Hybrid Recognition CNN-based prediction with OCR fallback
    ⚡ Optimized Preprocessing	Speed + accuracy with contrast enhancement and resizing
    📍 Location-Aware Guidance	Uses the Haversine formula for real-time navigation
    🧱 Modular Architecture Clear separation between UI, model, server, and audio engine
    🕶 AR-Ready by Design Supports reactive display for smart glasses

🗂 Key Project Files
File	              Role & Description
index.html	          Main UI: Image capture, location input
ar.html	              AR smart glasses interface (live updates on AR glasses)
server.js	          Node.js backend: location logic, routing, TTS
model_1.py	          Python: Deep learning model inference
audio_conversion.py	  Google TTS for audio output
landmarks2.json	      Local database of landmark metadata(contains landmarks, theor gps coordinates and their description)
