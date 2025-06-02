import streamlit as st
import joblib
import pandas as pd

# Step 1: Load the saved best model pipeline
best_model = joblib.load("best_model.pkl")  # Load the best model pipeline

# Step 2: Define the categorical and numeric columns
categorical_columns = ['Mental Status', 'Gender', 'Extracurricular Activities', 'Family Support',
                       'guardian', 'schoolsup', 'paidClass', 'Parent Education']
numeric_columns = ['Attendance Rate', 'Study Hours per Week', 'Previous Mathematics  average', 
                   'Previous Physics average', 'Previous Chemistry average', 'failures', 
                   'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'absences']

# Step 3: Define the unique categories for each categorical feature (from your input)
categorical_options = {
    'Mental Status': ['Mild', 'Moderate', 'Normal', 'Severe'],
    'Gender': ['Female', 'Male'],
    'Extracurricular Activities': ['High', 'Low', 'None'],
    'Family Support': ['Minimal', 'Moderate', 'None', 'Strong'],
    'guardian': ['father', 'mother', 'other'],
    'schoolsup': ['High', 'None'],
    'paidClass': ['High', 'None'],
    'Parent Education': ['Degree', 'Diploma level', 'High school', 'Master', 'NVQ qualified', 'None']
}

# Step 4: Create Streamlit UI dynamically for input based on the encoder and scaler
st.title("Stress Level Prediction App 📚")
st.write("Please provide the input details to predict the stress level class.")

# Initialize input dictionary to store values
inputs = {}

# Process categorical inputs dynamically
for column in categorical_columns:
    # For each categorical column, provide the user the encoded options dynamically
    options = categorical_options[column]
    inputs[column] = st.selectbox(f"{column}", options=options)

# Add numeric inputs dynamically
for column in numeric_columns:
    inputs[column] = st.number_input(f"{column}", min_value=0, max_value=100, value=0)

# Step 5: Add a button to submit the input
if st.button('Submit'):
    # Step 6: Prepare the sample input as DataFrame
    sample_input = inputs
    sample_input_df = pd.DataFrame([sample_input])

    # Step 7: Use the full pipeline to preprocess the data and make a prediction
    # The pipeline has the preprocessing steps (scaler + encoder) built-in
    predicted_class = best_model.predict(sample_input_df)

    # Step 8: Output the prediction
    st.write(f"Predicted Study Plan 📚: {predicted_class[0]}")
