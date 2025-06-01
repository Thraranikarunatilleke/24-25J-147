import requests

# URL of the Flask API
url = "http://192.168.1.101:5005/predict"

# Sample input data
test_data = {
    "Student Location": "Colombo",
    "Stress Level": "Mild"
}

# Make a POST request to the API
response = requests.post(url, json=test_data)

# Print the response
if response.status_code == 200:
    print("Prediction successful!")
    print("Response:", response.json())
else:
    print("Error occurred!")
    print("Status Code:", response.status_code)
    print("Response:", response.json())
