import requests
import json
import os

def fetch_ml_data():
    url = "http://localhost:3000/api/fetchMLdata"
    
    try:
        response = requests.get(url, headers={"x-ml-api-key": os.environ.get("ML_API_KEY", "")})
        response.raise_for_status()  # Raise an error for HTTP errors (4xx, 5xx)
        
        data = response.json()  # Parse the JSON response
        print("Fetched Data:", data)

        # Save data to a JSON file
        file_path = "ml_data.json"
        with open(file_path, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4)  # Pretty-print the JSON for readability
        
        print(f"Data successfully saved to {file_path}")
        return data
    except requests.exceptions.RequestException as e:
        print("Error fetching data:", e)
        return None

# Call the function
fetch_ml_data()
