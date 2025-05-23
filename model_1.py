
import cv2
import numpy as np
import pytesseract
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from gtts import gTTS
import json
import os
import sys

# Unicode-friendly console
sys.stdout.reconfigure(encoding='utf-8')

# Configure Tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Suppress TensorFlow logs
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.keras.utils.disable_interactive_logging()

# Load Keras model and label data
model = load_model('landmark_mobilenetv2.h5')
class_labels = ['acad', 'auditorium', 'bose', 'canteen', 'complex', 'lab', 'raman', 'ramanujan']
IMG_SIZE = 224
CONFIDENCE_THRESHOLD = 0.6

with open('landmarks2.json', 'r') as f:
    descriptions = json.load(f)

# ---------- COMPRESSION FUNCTION ----------
def compress_image(img, max_dim=640, quality=95):
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    encode_param = [int(cv2.IMWRITE_PNG_COMPRESSION), 3]  # 0 = none, 9 = max
    result, encimg = cv2.imencode('.png', img, encode_param)
    if result:
        img = cv2.imdecode(encimg, 1)
    return img

# ---------- REST OF THE PIPELINE ----------
def enhance_image(img):
    img = cv2.convertScaleAbs(img, alpha=1.2, beta=10)
    img = cv2.GaussianBlur(img, (3, 3), 0)
    return img

def preprocess_image(img):
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = img.astype("float") / 255.0
    img = img_to_array(img)
    img = np.expand_dims(img, axis=0)
    return img

def predict_landmark(img):
    if img.shape[0] > img.shape[1]:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)

    img = enhance_image(img)
    processed = preprocess_image(img)

    preds = model.predict(processed, verbose=0)[0]
    max_confidence = np.max(preds)
    predicted_idx = np.argmax(preds)
    predicted_class = class_labels[predicted_idx]

    if max_confidence < CONFIDENCE_THRESHOLD:
        ocr_text = pytesseract.image_to_string(img).lower()
        for landmark in class_labels:
            if landmark in ocr_text:
                return landmark, max_confidence

    return predicted_class, max_confidence

def get_description(landmark):
    return descriptions.get(landmark, {}).get('description', "Description not available.")

def generate_audio(label):
    text = f"The identified landmark is {label}"
    audio = gTTS(text)
    output_dir = os.path.join("static", "audio")
    os.makedirs(output_dir, exist_ok=True)
    audio_path = os.path.join(output_dir, f"{label}.mp3")
    audio.save(audio_path)
    return audio_path

def capture_from_webcam():
    cap = cv2.VideoCapture(0)
    print("📷 Press SPACE to capture an image, ESC to exit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to grab frame")
            break
        cv2.imshow("Press SPACE to capture", frame)

        key = cv2.waitKey(1)
        if key % 256 == 27:  # ESC
            cap.release()
            cv2.destroyAllWindows()
            print("🛑 Exiting capture.")
            return None
        elif key % 256 == 32:  # SPACE
            cap.release()
            cv2.destroyAllWindows()
            return frame

    cap.release()
    cv2.destroyAllWindows()
    return None

def classify_image(img=None, image_path=None, use_webcam=False):
    if use_webcam:
        img = capture_from_webcam()
        if img is None:
            return None, None, "No image captured.", None

    elif image_path is not None:
        if not os.path.exists(image_path):
            return None, None, f"Image file not found: {image_path}", None
        img = cv2.imread(image_path)
        if img is None:
            return None, None, "Failed to read image from file.", None

    elif img is None:
        return None, None, "No image input provided.", None

    # 🔽 Apply compression just once
    img = compress_image(img)

    predicted_class, confidence = predict_landmark(img)
    description = get_description(predicted_class)
    audio_path = generate_audio(predicted_class)

    return predicted_class, confidence, description, audio_path

def main():
    predicted_class, confidence, description, audio_path = classify_image(use_webcam=True)
    if predicted_class is None:
        print(description)
        return

    print(f"\n✅ Prediction: {predicted_class} (Confidence: {confidence:.2f})")
    print(f"\n📖 Description:\n{description}")
    print(f"\n🔊 Audio file saved at: {audio_path}")

def cli_classify(image_path):
    predicted_class, confidence, description, audio_path = classify_image(image_path=image_path)
    if predicted_class is None:
        result = {
            "error": description
        }
    else:
        result = {
            "label": predicted_class,
            "confidence": float(confidence),
            "description": description,
            "audio": audio_path.replace("\\", "/")
        }
    print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cli_classify(sys.argv[1])
    else:
        main()
