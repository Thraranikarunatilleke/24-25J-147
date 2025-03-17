import requests

# Base URL of the Flask app
base_url = "http://127.0.0.1:5000/predict"

# Sample test cases
test_cases = [
    {"Emotion": "Aggressive", "Climate": "Cloudy", "Time": "Morning"}
]

# Iterate through test cases and make requests
for i, case in enumerate(test_cases, start=1):
    print(f"Test Case {i}: {case}")
    response = requests.get(base_url, params=case)
    if response.status_code == 200:
        print("Response:", response.json())
    else:
        print("Error:", response.json())
    print("-" * 50)
