// src/WeatherTrend.js
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
export default function WeatherTrend() {
    const [city, setCity] = useState('');
    const [trendData, setTrendData] = useState([]);
    return (
        <div>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City"/>
            <button onClick={() =>
                fetch(`/api/analytics/${city}`).then(r => r.json()).then(d =>
                    setTrendData(d.trendData)
                )
            }>Show Trend</button>
            <Line data={{
                labels: Array(trendData.length).fill('').map((_, i) => i),
                datasets: [{ label: "Temp", data: trendData }]
            }} />
        </div>
    );
}
