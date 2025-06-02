from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)

# Load the saved best model pipeline
best_model = joblib.load("best_model.pkl")

# Define the categorical and numeric columns
categorical_columns = ['Mental Status', 'Gender', 'Extracurricular Activities', 'Family Support',
                       'guardian', 'schoolsup', 'paidClass', 'Parent Education']
numeric_columns = ['Attendance Rate', 'Study Hours per Week', 'Previous Mathematics  average', 
                   'Previous Physics average', 'Previous Chemistry average', 'failures', 
                   'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'absences']

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON request data
        data = request.get_json()
        
        # Ensure all required fields are present
        missing_columns = [col for col in categorical_columns + numeric_columns if col not in data]
        if missing_columns:
            return jsonify({"error": f"Missing columns: {missing_columns}"}), 400
        
        # Create DataFrame from input
        input_df = pd.DataFrame([data])
        print(data)
        
        # Make prediction using the preloaded model
        predicted_class = best_model.predict(input_df)
        
        # Convert NumPy int64 to Python int
        predicted_value = int(predicted_class[0]) if isinstance(predicted_class[0], np.integer) else predicted_class[0]

        return jsonify({"Predicted Study Plan": predicted_value})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port='5002', host='0.0.0.0')
