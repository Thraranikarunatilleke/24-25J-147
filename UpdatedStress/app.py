from flask import Flask, request, jsonify
import numpy as np
import joblib

app = Flask(__name__)

# Load the model and label encoder
model = joblib.load('best_model.pkl')
encoder = joblib.load('label_encoder.pkl')
model_2 = joblib.load('best_model_2.pkl')
encoder_2 = joblib.load('label_encoder_2.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint to predict the class based on input features.
    Expects a JSON payload with 7 numeric inputs in the range [0-3].
    """
    try:
        # Parse input JSON
        input_data = request.json
        if not input_data:
            return jsonify({"error": "No input data provided"}), 400

        # Validate input length
        features = input_data.get("features")
        if len(features) != 7:
            return jsonify({"error": "Input must contain exactly 7 features"}), 400
        
        # Convert features to NumPy array
        sample_input = np.array([features])  

        # Make predictions
        encoded_prediction = model.predict(sample_input)
        decoded_prediction = encoder.inverse_transform(encoded_prediction).tolist()[0]
        
        encoded_prediction_2 = model_2.predict(sample_input)
        decoded_prediction_2 = encoder_2.inverse_transform(encoded_prediction_2).tolist()[0]

        # Convert results to Python native types and return
        return jsonify({
            "predicted_class": str(decoded_prediction),
            "predicted_doctor": str(decoded_prediction_2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port='5004', host='0.0.0.0')
