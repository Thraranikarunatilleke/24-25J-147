from flask import Flask, request, jsonify
import pickle
import pandas as pd

# Load the saved model and encoders
with open("best_model_Random Forest.pkl", "rb") as f:
    model = pickle.load(f)

with open("feature_encoders.pkl", "rb") as f:
    feature_encoders = pickle.load(f)

with open("target_encoder.pkl", "rb") as f:
    target_encoder = pickle.load(f)

# Initialize Flask app
app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    # Parse input JSON
    data = request.get_json()
    try:
        # Extract features
        student_location = data.get("Student Location")
        stress_level = data.get("Stress Level")
        
        # Validate inputs
        if not student_location or not stress_level:
            return jsonify({"error": "Missing required inputs: 'Student Location' and/or 'Stress Level'"}), 400
        
        # Encode input features
        encoded_features = [
            feature_encoders["Student Location"].transform([student_location])[0],
            feature_encoders["Stress Level"].transform([stress_level])[0]
        ]
        
        # Convert to DataFrame for model compatibility
        input_df = pd.DataFrame([encoded_features], columns=["Student Location", "Stress Level"])
        
        # Make prediction
        prediction_encoded = model.predict(input_df)[0]
        prediction = target_encoder.inverse_transform([prediction_encoded])[0]
        
        return jsonify({"predicted_name": prediction})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == "__main__":
    app.run(debug=True, port='5005', host='0.0.0.0')
