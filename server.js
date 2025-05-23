const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path');
const { exec, spawn } = require('child_process');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const upload = multer(); // memory storage for uploaded files

// Paths to Python scripts
const pythonScript = path.join(__dirname, 'audio_conversion.py');
const pythonClassifyScript = path.join(__dirname, 'model_1.py');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'static')));

// Landmark data with GPS coordinates and descriptions
const landmarksData = {
    auditorium: { gps: [21.12845541824991, 81.76558735795037], description: "Auditorium for events and lectures." },
    canteen: { gps: [21.128007, 81.765831], description: "Canteen serving food and beverages." },
    acad: { gps: [21.128032655514257, 81.76637771291134], description: "Academic building with classrooms." },
    lab: { gps: [21.128412142412103, 81.76695549822541], description: "Laboratories for practical work." },
    complex: { gps: [21.129094161698102, 81.76708780512256], description: "Main complex with offices." },
    ramanujan: { gps: [21.12987090580691, 81.76611197236053], description: "Ramanujan block with research labs." },
    bose: { gps: [21.12778689753694, 81.76441243040722], description: "Bose building for physics department." }
};

// Track visited landmarks to avoid repeating instructions
let visited = {
    auditorium: false,
    canteen: false,
    acad: false,
    lab: false,
    complex: false,
    ramanujan: false,
    bose: false,
    raman: false
};

// Helper: Calculate distance in meters between two GPS points using Haversine formula
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    const R = 6371e3; // Earth radius in meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Find nearest unvisited landmarks (default top 2) and prepare message
function getNearestUnvisitedLandmarks(currLat, currLon, landmarks, visited, topN = 2) {
    let distances = [];

    for (let landmark in landmarks) {
        if (!visited[landmark]) {
            const [lat, lon] = landmarks[landmark].gps;
            const dist = getDistanceInMeters(currLat, currLon, lat, lon);
            distances.push({ name: landmark, distance: dist });
        }
    }

    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances.slice(0, topN);

    let messageParts = nearest.map(l => `${capitalize(l.name)} is ${Math.round(l.distance)} meters away.`);
    let message = messageParts.join(' ');

    return { message, nearest };
}

// Capitalize string helper
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// POST: Receive user's GPS location, find nearest landmarks, generate audio instructions
app.post('/send-location', (req, res) => {
    const { latitude, longitude } = req.body;
    console.log(`📍 Received location: ${latitude}, ${longitude}`);

    const { message } = getNearestUnvisitedLandmarks(latitude, longitude, landmarksData, visited, 2);

    // Escape shell special chars to avoid injection risks
    const safeMessage = message.replace(/(["\\$`])/g, '\\$1');

    // Command to run python audio conversion script with the message as argument
    const cmd = `python "${pythonScript.replace(/\\/g, '\\\\')}" "${safeMessage}"`;

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error("❌ Python error:", err);
            if (stderr) console.error(stderr);
            // Send text message fallback if audio generation fails
            return res.json({ message });
        }

        const audioPath = stdout.trim();
        const filename = path.basename(audioPath);
        const audioUrl = `/audio/${filename}`;

        console.log(`✅ Audio generated: ${audioUrl}`);
        res.json({ message, audioUrl });
    });
});

// Serve audio files and delete them after sending to save space
app.get('/audio/:filename', (req, res) => {
    const audioFilePath = path.join(__dirname, 'static', req.params.filename);

    res.sendFile(audioFilePath, (err) => {
        if (err) {
            console.error('❌ Error sending audio file:', err);
            return res.status(500).send('Failed to send audio');
        }

        fs.unlink(audioFilePath, (unlinkErr) => {
            if (unlinkErr) {
                console.warn('⚠️ Failed to delete audio file:', unlinkErr);
            } else {
                console.log(`🧹 Deleted audio file: ${req.params.filename}`);
            }
        });
    });
});

// Endpoint for AR glasses to fetch current recognized landmark info
let currentLabel = "";
let currentDescription = "";

app.get('/current-label', (req, res) => {
    res.json({ 
        label: currentLabel, 
        description: currentDescription 
    });
});

// POST: Image classification route - receives image, calls python classifier, returns results
app.post('/classify-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    // Save uploaded image temporarily to disk for python script
    const tempImagePath = path.join(os.tmpdir(), `upload_${Date.now()}.jpg`);
    fs.writeFile(tempImagePath, req.file.buffer, (err) => {
        if (err) {
            console.error("Error saving temp image:", err);
            return res.status(500).json({ error: 'Failed to save uploaded image' });
        }

        // Spawn python classification script
        const pyProcess = spawn('python', [pythonClassifyScript, tempImagePath]);

        let pyOutput = '';
        let pyError = '';

        pyProcess.stdout.on('data', (data) => {
            pyOutput += data.toString();
        });

        pyProcess.stderr.on('data', (data) => {
            pyError += data.toString();
        });

        pyProcess.on('close', (code) => {
            // Clean up temp image file
            fs.unlink(tempImagePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.warn('Warning: Failed to delete temp image', unlinkErr);
                }
            });

            if (code !== 0) {
                console.error('Python script error:', pyError);
                return res.status(500).json({ error: 'Image classification failed' });
            }

            try {
                // Parse last JSON line from python output (in case of logs)
                const lines = pyOutput.trim().split('\n');
                let jsonData = null;

                for (let i = lines.length - 1; i >= 0; i--) {
                    const line = lines[i].trim();
                    if (line.startsWith('{') && line.endsWith('}')) {
                        try {
                            jsonData = JSON.parse(line);
                            break;
                        } catch {
                            continue;
                        }
                    }
                }

                if (!jsonData) throw new Error("No valid JSON found in Python output");

                // Update AR glasses current label and description
                if (jsonData.label) {
                    currentLabel = jsonData.label;
                    currentDescription = jsonData.description || "";
                    console.log(`🎯 AR Update: ${currentLabel}`);
                }

                // Mark landmark as visited
                if (jsonData.label && visited.hasOwnProperty(jsonData.label)) {
                    visited[jsonData.label] = true;
                    console.log(`✅ Landmark visited: ${jsonData.label}`);
                }

                return res.json(jsonData);
            } catch (parseErr) {
                console.error('Failed to parse Python output:', parseErr);
                console.error('Raw output was:', pyOutput);
                return res.status(500).json({ error: 'Invalid response from classification script', details: parseErr.message });
            }
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
