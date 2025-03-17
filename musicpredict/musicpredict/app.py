from flask import Flask, request, jsonify
import joblib
import numpy as np

# Initialize the Flask app
app = Flask(__name__)

# Paths to load the saved files
best_model_path = "best_model.pkl"
encoders_path = "label_encoders.pkl"
scaler_path = "scaler.pkl"

# Load the saved objects
best_model = joblib.load(best_model_path)
label_encoders = joblib.load(encoders_path)
scaler = joblib.load(scaler_path)

# Preprocessing function
def preprocess_sample(sample, encoders, scaler):
    # Encode categorical columns
    encoded = []
    for col, encoder in encoders.items():
        if col in sample:
            encoded.append(encoder.transform([sample[col]])[0])
    
    # Convert to NumPy array and reshape
    encoded = np.array(encoded).reshape(1, -1)
    
    # Scale the features
    scaled = scaler.transform(encoded)
    return scaled

# Route to predict the playlist
@app.route('/predict', methods=['GET'])
def predict():
    # Get parameters from the URL
    emotion = request.args.get('Emotion')
    climate = request.args.get('Climate')
    time_of_day = request.args.get('Time')
    
    # Validate input
    if not emotion or not climate or not time_of_day:
        return jsonify({"error": "Missing required parameters: Emotion, Climate, Time"}), 400
    
    # Check if the values are valid
    if emotion not in label_encoders['Emotion'].classes_:
        return jsonify({"error": f"Invalid Emotion. Must be one of {list(label_encoders['Emotion'].classes_)}"}), 400
    if climate not in label_encoders['Climate'].classes_:
        return jsonify({"error": f"Invalid Climate. Must be one of {list(label_encoders['Climate'].classes_)}"}), 400
    if time_of_day not in label_encoders['Time'].classes_:
        return jsonify({"error": f"Invalid Time. Must be one of {list(label_encoders['Time'].classes_)}"}), 400
    
    # Create sample input
    sample_input = {
        'Emotion': emotion,
        'Climate': climate,
        'Time': time_of_day
    }
    
    # Preprocess and predict
    preprocessed_input = preprocess_sample(sample_input, label_encoders, scaler)
    predicted_class = best_model.predict(preprocessed_input)
    
    # Return the prediction
    return jsonify({"Predicted Playlist": f"Playlist {predicted_class[0]}"})

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
