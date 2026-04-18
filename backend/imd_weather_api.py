from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route("/api/imd-india-weather")
def get_imd_weather():
    url = "https://mausam.imd.gov.in/"  # IMD homepage, update if different
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    results = {}

    # Find region/city weather from the HTML. The selectors may change: inspect IMD page source!
    # Assume there's a current weather table or div with region/city & desc icons
    for row in soup.select(".weather-table tr"):
        cols = row.find_all("td")
        if len(cols) >= 2:
            region = cols[0].get_text(strip=True)
            condition = cols[1].get_text(strip=True)
            results[region] = condition

    # Alternative approach: parse specific weather icon markers or labels
    # (You may need to update this block depending on the page layout)
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Or any open port
