import requests
import json

# URL of the Flask app endpoint
url = "http://127.0.0.1:5004/predict"

# Example input features for testing
test_data = {
    "features": [2, 0, 1, 3, 3, 2, 1]
}

try:
    # Send a POST request with the test data
    response = requests.post(url, json=test_data)

    # Handle the response
    if response.status_code == 200:
        result = response.json()
        if "predicted_class" in result and "predicted_doctor" in result:
            print("Prediction result:")
            print(f"Class: {result['predicted_class']}")
            print(f"Doctor: {result['predicted_doctor']}")
        else:
            print("Unexpected response format:", result)
    else:
        print(f"Error: {response.status_code}")
        print("Response:", response.json())
except Exception as e:
    print("An error occurred while making the request:", str(e))
