import streamlit as st
import numpy as np
import joblib

# Load the trained model and encoder
@st.cache_resource
def load_model():
    model = joblib.load('best_model.pkl')
    encoder = joblib.load('label_encoder.pkl')
    return model, encoder

model, encoder = load_model()

# Streamlit app title and description
st.title("ML Model Prediction App")
st.write("Enter values for the 21 features to predict the class.")

# Dropdown inputs for 21 features (values 0 to 3)
feature_values = []
for i in range(1, 22):  # Features are indexed 1 to 21 for user clarity
    value = st.selectbox(f"Feature {i}", options=[0, 1, 2, 3], key=f"feature_{i}")
    feature_values.append(value)

# Predict button
if st.button("Predict"):
    # Convert input features to numpy array
    sample_input = np.array([feature_values])  # Shape (1, 21)
    
    # Model prediction
    try:
        encoded_prediction = model.predict(sample_input)  # Encoded prediction
        decoded_prediction = encoder.inverse_transform(encoded_prediction)  # Decode to original label
        
        # Display the result
        st.success(f"The predicted class is: {decoded_prediction[0]}")
    except Exception as e:
        st.error(f"An error occurred during prediction: {e}")
