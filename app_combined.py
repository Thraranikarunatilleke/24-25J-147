from flask import Flask, request, jsonify, send_file
import tensorflow as tf
import numpy as np
import cv2
import librosa
import joblib
import os
import logging
from tensorflow.keras.preprocessing import image
from collections import deque
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration for models
AUDIO_MODEL_FOLDER = "weights/audio_model"

FACE_MODEL_PATH = "weights/video_model/best_emotion_model_phase_2.keras"
IMG_SIZE = 224
OUTPUT_DIR = "processed_videos"  # Directory to store processed videos

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load models at startup
try:
    # Load audio emotion recognition model and related components
    audio_model_path = os.path.join(AUDIO_MODEL_FOLDER, "emotion_classification_model.h5")
    scaler_path = os.path.join(AUDIO_MODEL_FOLDER, "scaler.pkl")
    label_encoder_path = os.path.join(AUDIO_MODEL_FOLDER, "label_encoder.pkl")

    audio_model = tf.keras.models.load_model(audio_model_path)
    scaler = joblib.load(scaler_path)
    label_encoder = joblib.load(label_encoder_path)

    logger.info(f"Audio model loaded successfully from {audio_model_path}")

    # Load facial emotion recognition model
    face_model = tf.keras.models.load_model(FACE_MODEL_PATH)
    logger.info(f"Facial model loaded successfully from {FACE_MODEL_PATH}")

except Exception as e:
    logger.error(f"Error loading models: {str(e)}")
    audio_model = None
    face_model = None

# Define Audio processing functions
def extract_features_from_audio(filepath, n_mfcc=30):
    """Extract audio features for emotion prediction"""
    data, sr = librosa.load(filepath, duration=2.5, offset=0.6)
    zcr = np.mean(librosa.feature.zero_crossing_rate(y=data))
    rmse = np.mean(librosa.feature.rms(y=data))
    mfccs = np.mean(librosa.feature.mfcc(y=data, sr=sr, n_mfcc=n_mfcc).T, axis=0)
    features = np.hstack((zcr, rmse, mfccs))
    return features

# Define Face processing functions
def preprocess_image(img):
    """Preprocess image for facial emotion prediction"""
    if isinstance(img, str):
        img = image.load_img(img, target_size=(IMG_SIZE, IMG_SIZE))
        img = image.img_to_array(img)
    else:
        img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))

    img_array = np.expand_dims(img, axis=0)
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

def predict_face_emotion(img):
    """Predict emotion from facial image"""
    preprocessed_image = preprocess_image(img)
    predictions = face_model.predict(preprocessed_image)
    predicted_class = np.argmax(predictions[0])

    emotion_labels = ['aggressive', 'lazy_nervous', 'normal', 'tired_sleepy']
    predicted_emotion = emotion_labels[predicted_class]

    return predicted_emotion, predictions[0]

class EmotionPredictor:
    """Class for temporal smoothing of predictions"""
    def __init__(self, window_size=5):
        self.emotion_history = deque(maxlen=window_size)
        self.prob_history = deque(maxlen=window_size)
        self.window_size = window_size
        self.emotion_labels = ['aggressive', 'lazy_nervous', 'normal', 'tired_sleepy']

    def update(self, emotion, probs):
        self.emotion_history.append(emotion)
        self.prob_history.append(probs)

    def get_smooth_prediction(self):
        if not self.emotion_history:
            return None, None

        # Get most frequent emotion
        emotion = max(set(self.emotion_history), key=self.emotion_history.count)

        # Average probabilities
        avg_probs = np.mean(self.prob_history, axis=0)

        return emotion, avg_probs

def process_video(video_path, output_path=None, sample_rate=1):
    """
    Process video and save annotated result
    Args:
        video_path: Path to input video
        output_path: Path to save annotated video (optional)
        sample_rate: Process 1 frame every N frames (for speed)
    Returns:
        Path to the processed video and summary of emotions
    """
    if not os.path.exists(video_path):
        logger.error(f"Error: Video not found at {video_path}")
        raise FileNotFoundError(f"Video not found at {video_path}")

    # Open video
    cap = cv2.VideoCapture(video_path)

    # Get video properties
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Prepare output video writer
    if not output_path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(OUTPUT_DIR, f"processed_video_{timestamp}.mp4")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))

    frame_count = 0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Initialize emotion predictor for smooth predictions
    predictor = EmotionPredictor(window_size=5)

    # Track emotion distribution for summary
    emotion_counts = {
        'aggressive': 0,
        'lazy_nervous': 0,
        'normal': 0,
        'tired_sleepy': 0
    }

    processed_frames = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # Process only every Nth frame for efficiency
            if frame_count % sample_rate != 0:
                out.write(frame)  # Write the original frame
                continue

            processed_frames += 1

            # Convert to RGB for prediction
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Get prediction
            emotion, probs = predict_face_emotion(frame_rgb)

            # Update predictor with new prediction
            predictor.update(emotion, probs)

            # Get smooth prediction
            smooth_emotion, smooth_probs = predictor.get_smooth_prediction()

            if smooth_emotion is not None:
                # Update emotion counts for summary
                emotion_counts[smooth_emotion] += 1

                # Prepare probability text with smoothed predictions
                prob_text = f"Probabilities:"
                emotion_labels = ['aggressive', 'lazy_nervous', 'normal', 'tired_sleepy']
                for label, prob in zip(emotion_labels, smooth_probs):
                    prob_text += f"\n{label}: {prob:.2f}"

                # Add text to frame
                frame = cv2.putText(frame, f"Emotion: {smooth_emotion}", (10, 30),
                                  cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

                y = 70
                for line in prob_text.split('\n'):
                    frame = cv2.putText(frame, line, (10, y),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    y += 30

            # Show progress
            if frame_count % (30 * sample_rate) == 0:  # Update progress periodically
                logger.info(f"Processing frame {frame_count}/{total_frames} ({frame_count/total_frames*100:.1f}%)")

            # Write frame
            out.write(frame)

    except Exception as e:
        logger.exception(f"Error processing video: {str(e)}")
        raise
    finally:
        # Release resources
        cap.release()
        out.release()

    # Calculate dominant emotion
    dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0] if processed_frames > 0 else "unknown"

    # Calculate percentages
    emotion_percentages = {}
    for emotion, count in emotion_counts.items():
        if processed_frames > 0:
            emotion_percentages[emotion] = (count / processed_frames) * 100
        else:
            emotion_percentages[emotion] = 0

    # Create summary
    summary = {
        "processed_frames": processed_frames,
        "total_frames": total_frames,
        "dominant_emotion": dominant_emotion,
        "emotion_distribution": emotion_percentages,
        "processed_video_path": output_path
    }

    logger.info(f"Video processing complete. Dominant emotion: {dominant_emotion}")
    logger.info(f"Processed video saved to {output_path}")

    return output_path, summary

# Endpoints for Audio Emotion Recognition
@app.route("/predict-audio", methods=["POST"])
def predict_audio_emotion():
    """
    Endpoint to predict emotion from an uploaded WAV file.
    Usage with curl:
      curl -X POST -F audio_file=@test.wav http://localhost:5000/predict-audio
    """
    if "audio_file" not in request.files:
        return jsonify({"error": "No audio_file in request"}), 400

    audio_file = request.files["audio_file"]

    # Save the file temporarily
    filepath = "temp_audio.wav"
    audio_file.save(filepath)

    try:
        # Extract features
        features = extract_features_from_audio(filepath)

        # Scale the features
        features_scaled = scaler.transform([features])  # shape: (1, 32)

        # Reshape for CNN-LSTM => (1, 32, 1)
        features_scaled = np.reshape(features_scaled, (features_scaled.shape[0], features_scaled.shape[1], 1))

        # Predict
        predictions = audio_model.predict(features_scaled)
        predicted_index = np.argmax(predictions, axis=1)[0]
        predicted_emotion = label_encoder.inverse_transform([predicted_index])[0]

        EMOTION_MAPPING = {
            "fear": "nervous",
            "angry": "aggressive",
            "bored": "lazy",
            "neutral": "natural"
        }

        mapped_emotion = EMOTION_MAPPING.get(predicted_emotion, predicted_emotion)

        # Cleanup temp file
        if os.path.exists(filepath):
            os.remove(filepath)

        # Return JSON response
        return jsonify({
            "emotion": mapped_emotion,
            "confidence": float(np.max(predictions))
        })

    except Exception as e:
        logger.exception("Error during audio prediction")
        return jsonify({"error": str(e)}), 500

# Endpoints for Facial Emotion Recognition
@app.route("/predict-face", methods=["POST"])
def predict_face_emotion_endpoint():
    """
    Endpoint to predict emotion from an uploaded image file.
    Usage with curl:
      curl -X POST -F image_file=@face.jpg http://localhost:5000/predict-face
    """
    if "image_file" not in request.files:
        return jsonify({"error": "No image_file in request"}), 400

    image_file = request.files["image_file"]

    if not image_file.filename:
        return jsonify({"error": "Empty filename"}), 400

    try:
        # Save the file temporarily
        filepath = "temp_face.jpg"
        image_file.save(filepath)

        # Read the image with OpenCV
        img = cv2.imread(filepath)
        if img is None:
            return jsonify({"error": "Failed to read image"}), 400

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Get prediction
        emotion, probs = predict_face_emotion(img_rgb)

        # Convert probabilities to standard Python float for JSON serialization
        probabilities = {
            'aggressive': float(probs[0]),
            'lazy_nervous': float(probs[1]),
            'normal': float(probs[2]),
            'tired_sleepy': float(probs[3])
        }

        # Cleanup temp file
        if os.path.exists(filepath):
            os.remove(filepath)

        # Return JSON response
        return jsonify({
            "emotion": emotion,
            "probabilities": probabilities,
            "confidence": float(np.max(probs))
        })

    except Exception as e:
        logger.exception("Error during facial prediction")
        return jsonify({"error": str(e)}), 500

@app.route("/process-video", methods=["POST"])
def process_video_endpoint():
    """
    Endpoint to process a video file for facial emotion recognition.
    The video is analyzed frame by frame, with emotions detected and annotated.

    Parameters:
    - video_file: The video file to process
    - sample_rate: (optional) Process 1 frame every N frames for efficiency (default=1)
    - return_video: (optional) Whether to return the processed video (default=False)

    Usage with curl:
      curl -X POST -F "video_file=@test.mp4" -F "sample_rate=5" http://localhost:5000/process-video

    Returns:
    - JSON with emotion analysis and path to processed video
    - If return_video=true, returns the processed video file
    """
    if "video_file" not in request.files:
        return jsonify({"error": "No video_file in request"}), 400

    video_file = request.files["video_file"]

    if not video_file.filename:
        return jsonify({"error": "Empty filename"}), 400

    # Get processing parameters
    sample_rate = int(request.form.get("sample_rate", 1))
    return_video = request.form.get("return_video", "false").lower() == "true"

    # Create a unique identifier for this job
    job_id = datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + str(hash(video_file.filename) % 10000)
    temp_video_path = f"temp_video_{job_id}{os.path.splitext(video_file.filename)[1]}"
    output_path = os.path.join(OUTPUT_DIR, f"processed_{job_id}{os.path.splitext(video_file.filename)[1]}")

    logger.info(f"Starting video processing job #{job_id} for file {video_file.filename}")

    try:
        # Save the file temporarily
        video_file.save(temp_video_path)

        # First check if the video file is valid
        cap = cv2.VideoCapture(temp_video_path)
        if not cap.isOpened():
            cap.release()
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            return jsonify({"error": "Could not open video file. The file may be corrupted or in an unsupported format."}), 400

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        duration = total_frames / fps if fps > 0 else 0
        cap.release()

        logger.info(f"Video info: {total_frames} frames, {fps} FPS, ~{duration:.1f} seconds")

        # If video is very large, suggest using a higher sample rate
        if total_frames > 1000 and sample_rate == 1:
            logger.warning(f"Large video with {total_frames} frames. Consider using sample_rate > 1 for faster processing.")

        # Process the video - this will block until complete
        logger.info(f"Processing video {video_file.filename} with sample rate {sample_rate}")
        start_time = datetime.now()

        processed_path, summary = process_video(
            temp_video_path,
            output_path=output_path,
            sample_rate=sample_rate
        )

        # Calculate processing time
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()

        logger.info(f"Video processing completed in {processing_time:.2f} seconds")

        # Clean up temporary file
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

        # Add processing metadata to summary
        summary["processing_metadata"] = {
            "processing_time_seconds": processing_time,
            "job_id": job_id,
            "sample_rate": sample_rate
        }

        # Return the processed video if requested
        if return_video and os.path.exists(processed_path):
            logger.info(f"Returning processed video file: {processed_path}")
            return send_file(processed_path, as_attachment=True,
                            download_name=f"processed_{os.path.basename(video_file.filename)}")

        # Otherwise return the summary as JSON
        return jsonify({
            "status": "success",
            "filename": video_file.filename,
            "processed_video": os.path.basename(processed_path),
            "processing_time_seconds": processing_time,
            "job_id": job_id,
            "analysis": summary
        })

    except Exception as e:
        logger.exception(f"Error during video processing for job #{job_id}")
        # Clean up any temporary files
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        return jsonify({
            "status": "error",
            "error": str(e),
            "job_id": job_id
        }), 500

# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "healthy",
        "models_loaded": {
            "audio_model": audio_model is not None,
            "face_model": face_model is not None
        }
    })

if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    port = int(os.getenv('FLASK_PORT', 8000))
    app.run(host=host, port=port, debug=True)