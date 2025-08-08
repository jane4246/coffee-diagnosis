from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os

app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication

# Load model and set up paths
MODEL_PATH = 'coffee_disease_model.h5'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load the trained model
try:
    model = load_model(MODEL_PATH)
    print("Image model loaded successfully.")
except Exception as e:
    print(f"Error loading image model: {e}")
    model = None

# Define class names for the image model
classes = ['Healthy', 'Rust', 'Leaf Miner', 'Other']

# Image preprocessing function
def prepare_image(img_path):
    img = image.load_img(img_path, target_size=(128, 128))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0  # Normalize to [0,1]
    return np.expand_dims(img_array, axis=0)

# Simple rule-based system for text/voice diagnosis
def diagnose_text_based(symptoms):
    symptoms_lower = symptoms.lower()
    
    if "yellow" in symptoms_lower and "spots" in symptoms_lower:
        return "Rust", 0.95
    if "brown" in symptoms_lower and "spots" in symptoms_lower:
        return "Leaf Spot", 0.90
    if "small holes" in symptoms_lower:
        return "Leaf Miner", 0.85
    if "wilting" in symptoms_lower or "yellowing" in symptoms_lower:
        return "Nutrient Deficiency or Watering Issue", 0.80
    
    return "Unknown", 0.70

# --- API Endpoints ---

@app.route('/predict_image', methods=['POST'])
def predict_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    if not model:
        return jsonify({'error': 'Image model not loaded.'}), 500

    file = request.files['image']
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        img = prepare_image(filepath)
        prediction = model.predict(img)[0]
        predicted_class = classes[np.argmax(prediction)]
        confidence = float(np.max(prediction))
        
        return jsonify({
            'prediction': predicted_class,
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.remove(filepath) # Clean up uploaded file

@app.route('/predict_text', methods=['POST'])
def predict_text():
    data = request.get_json()
    symptoms = data.get('symptoms', '')
    
    if not symptoms:
        return jsonify({'error': 'No symptoms provided'}), 400

    predicted_class, confidence = diagnose_text_based(symptoms)
    
    return jsonify({
        'prediction': predicted_class,
        'confidence': confidence
    })

@app.route('/predict_voice', methods=['POST'])
def predict_voice():
    # NOTE: In a real-world app, this route would first call a speech-to-text
    # service to get the symptoms from the audio. Here, we're assuming the
    # frontend sends the transcribed text.
    data = request.get_json()
    symptoms = data.get('symptoms', '')

    if not symptoms:
        return jsonify({'error': 'No symptoms provided from voice input'}), 400

    predicted_class, confidence = diagnose_text_based(symptoms)
    
    return jsonify({
        'prediction': predicted_class,
        'confidence': confidence
    })

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=10000)
