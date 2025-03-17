import streamlit as st
import joblib
import numpy as np

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

# Streamlit App
st.title("Song Playlist Predictor 🎵")

# Dropdowns for user input
emotion = st.selectbox("Select Emotion", label_encoders['Emotion'].classes_)
climate = st.selectbox("Select Climate", label_encoders['Climate'].classes_)
time_of_day = st.selectbox("Select Time of Day", label_encoders['Time'].classes_)

# Get prediction on button click
if st.button("Predict Playlist"):
    # Create sample input
    sample_input = {
        'Emotion': emotion,
        'Climate': climate,
        'Time': time_of_day
    }
    
    # Preprocess and predict
    preprocessed_input = preprocess_sample(sample_input, label_encoders, scaler)
    predicted_class = best_model.predict(preprocessed_input)
    
    # Display the result
    st.success(f"The predicted playlist is: Playlist {predicted_class[0]} 🎧")
