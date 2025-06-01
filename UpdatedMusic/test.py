import requests

# Define the API endpoint
url = "http://127.0.0.1:5000/predict"

# Define the input data
data = {
    "emotion": "Neutral",
    "weather": "Sunny",
    "time": "Morning"
}

# Send a POST request
response = requests.post(url, json=data)

# Print the response
if response.status_code == 200:
    print("Response from API:", response.json())
else:
    print("Error:", response.status_code, response.text)
