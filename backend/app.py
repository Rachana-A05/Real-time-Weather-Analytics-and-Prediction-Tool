from flask import Flask, jsonify
import requests
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ✅ Your API Key from OpenWeather
API_KEY = "d27c0341cd315299dd14a78370689f45"
BASE_URL = "https://api.openweathermap.org/data/2.5"

@app.route("/")
def home():
    return jsonify({"message": "✅ Flask Weather API is running!"})

@app.route("/api/weather/current/<city>")
def current_weather(city):
    try:
        response = requests.get(f"{BASE_URL}/weather", params={"q": city, "units": "metric", "appid": API_KEY})
        data = response.json()

        if response.status_code != 200:
            return jsonify({"error": data.get("message", "City not found")}), 404

        result = {
            "city": data["name"],
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"]
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/weather/forecast/<city>")
def forecast_weather(city):
    try:
        response = requests.get(f"{BASE_URL}/forecast", params={"q": city, "units": "metric", "appid": API_KEY})
        data = response.json()

        if response.status_code != 200:
            return jsonify({"error": data.get("message", "City not found")}), 404

        forecast = []
        for entry in data["list"][:5]:
            forecast.append({
                "date": entry["dt_txt"],
                "temperature": entry["main"]["temp"],
                "description": entry["weather"][0]["description"]
            })

        return jsonify({"city": data["city"]["name"], "forecast": forecast})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/weather/forecast/<city>', methods=['GET'])
def get_forecast(city):
    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        forecast_data = []

        # Get 5-day forecast at 12:00 PM each day
        for entry in data['list']:
            if "12:00:00" in entry['dt_txt']:
                forecast_data.append({
                    "date": entry['dt_txt'].split(" ")[0],
                    "temperature": entry['main']['temp'],
                    "description": entry['weather'][0]['description']
                })
        return jsonify({"city": city, "forecast": forecast_data})
    else:
        return jsonify({"error": "City not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5000)
