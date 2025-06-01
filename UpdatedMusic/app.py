from flask import Flask, request, jsonify
import joblib
import numpy as np
import tensorflow as tf

app = Flask(__name__)

# Load model and encoders
def load_model_and_encoders():
    model = tf.keras.models.load_model('playlist_model.h5')
    scaler = joblib.load('scaler.pkl')
    label_encoders = joblib.load('label_encoders.pkl')
    return model, scaler, label_encoders

# Load model and encoders
model, scaler, label_encoders = load_model_and_encoders()

@app.route('/predict', methods=['POST'])
def predict_playlist():
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['emotion', 'weather', 'time']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        emotion = data['emotion']
        weather = data['weather']
        time = data['time']
        
        # Validate input values against label encoders
        if emotion not in label_encoders['Emotion'].classes_:
            return jsonify({'error': f'Invalid emotion: {emotion}'}), 400
        if weather not in label_encoders['Weather'].classes_:
            return jsonify({'error': f'Invalid weather: {weather}'}), 400
        if time not in label_encoders['Time'].classes_:
            return jsonify({'error': f'Invalid time: {time}'}), 400
        
        # Encode the input data
        encoded_input = [
            label_encoders['Emotion'].transform([emotion])[0],
            label_encoders['Weather'].transform([weather])[0],
            label_encoders['Time'].transform([time])[0]
        ]
        
        # Scale input data
        scaled_input = scaler.transform([encoded_input])
        
        # Predict playlist number
        predictions = model.predict(scaled_input)
        predicted_class = np.argmax(predictions, axis=1)[0]
        
        # Ensure predicted_class is a valid integer
        if not isinstance(predicted_class, (int, np.integer)):
            return jsonify({'error': 'Invalid prediction output'}), 500
        
        return jsonify({"Recommended Playlist": int(predicted_class)})
    
    except Exception as e:
        # Log the error for debugging
        print(f"Error during prediction: {str(e)}")
        return jsonify({"error": "An error occurred during prediction"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)