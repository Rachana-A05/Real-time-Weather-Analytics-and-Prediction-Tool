const AlertModel = require("../models/Alert");
let status = {
  inProgress: false,
  lastRun: null,
  result: null,
};

exports.startBackfill = async (req, res) => {
  const { monthsBack } = req.body;
  if (status.inProgress) {
    return res.json({ success: false, message: "Backfill already in progress" });
  }
  status.inProgress = true;
  status.lastRun = new Date();
  status.result = null;

  try {
    const types = ["Temperature", "Wind", "Humidity", "Pressure", "AQI", "Weather"];
    const cities = ["Hyderabad", "Delhi", "Bangalore", "Ahmedabad", "Lucknow", "Kolkata", "Chennai", "Mumbai", "Jaipur", "Pune"];
    const severities = ["Low", "High", "Critical"];

    const inserts = [];
    // monthsBack: 1 = last month; 12 = full year, and so on.
    for (let i = 1; i <= monthsBack; i++) {
      // Base month for this round
      const monthBase = new Date();
      monthBase.setHours(0, 0, 0, 0);
      monthBase.setDate(1);
      monthBase.setMonth(monthBase.getMonth() - i);

      const m = monthBase.getMonth();

      let baseProb = 0.5, amp = 1;
      if ([3,4,5].includes(m)) { // Summer: Apr-Jun
        baseProb = 0.8; amp = 2;
      } else if ([6,7,8].includes(m)) { // Monsoon: Jul-Sep
        baseProb = 0.6; amp = 1.6;
      } else if ([11,0,1].includes(m)) { // Winter: Dec-Feb
        baseProb = 0.2; amp = 0.7;
      }

      for (let cityIdx = 0; cityIdx < cities.length; cityIdx++) {
        if (Math.random() > baseProb) continue;

        const alertsThisMonth = Math.floor((Math.random() * 4 + 1) * amp);
        for (let a = 0; a < alertsThisMonth; a++) {
          const tmp = new Date(monthBase);
          tmp.setDate(Math.floor(Math.random() * 28) + 1);  // spread in month
          tmp.setHours(Math.floor(Math.random() * 24));

          const city = cities[cityIdx];
          let seasonTypes = types;
          if ([3,4,5].includes(m)) {
            seasonTypes = ["Temperature","Wind","Temperature","Temperature","Wind","Humidity","Pressure","AQI"];
          } else if ([6,7,8].includes(m)) {
            seasonTypes = ["Wind","AQI","Wind","Weather","Humidity","Pressure"];
          } else if ([11,0,1].includes(m)) {
            seasonTypes = ["Humidity","Pressure","Pressure","Humidity","Weather"];
          }
          const type = seasonTypes[Math.floor(Math.random() * seasonTypes.length)];
          const severity = severities[Math.floor(Math.random() * severities.length)];

          let value, threshold, message;
          if (type === "Temperature") {
            value = Number((Math.random() * 10 + 27 + amp*3).toFixed(2));
            threshold = [20, 25][Math.floor(Math.random() * 2)];
            message = `High temperature alert: ${value}°C exceeds threshold of ${threshold}°C`;
          } else if (type === "Wind") {
            value = Number((Math.random() * 20 + 12 + amp*3).toFixed(2));
            threshold = 10;
            message = `High wind speed alert: ${value} km/h exceeds threshold of ${threshold} km/h`;
          } else if (type === "Humidity") {
            value = Math.floor(Math.random() * 20) + 40;
            threshold = 60;
            message = `Humidity alert: ${value}%`;
          } else if (type === "Pressure") {
            value = Math.floor(Math.random() * 21) + 950;
            threshold = 960;
            message = `Pressure alert: ${value} hPa, threshold: ${threshold} hPa`;
          } else if (type === "AQI") {
            value = Math.floor(Math.random() * 201) + 60;
            threshold = 120;
            message = `AQI alert: AQI ${value} exceeds threshold of ${threshold}`;
          } else if (type === "Weather") {
            value = Math.round(Math.random() * 2);
            threshold = Math.round(Math.random() * 2);
            message = "General weather alert";
          }

          inserts.push({
            __v: 0,
            type,
            city,
            message,
            severity,
            value,
            threshold,
            timestamp: new Date(tmp),
            resolved: false
          });
        }
      }
    }
    await AlertModel.insertMany(inserts);

    status.result = { inserted: inserts.length, monthsBack };
    status.inProgress = false;
    res.json({ success: true, message: "Backfill complete (seasonal-realistic)" });
  } catch (err) {
    status.inProgress = false;
    status.result = { error: err.message };
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBackfillStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      status: status.inProgress ? "Processing..." : "Idle",
      result: status.result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get backfill status",
      error: error.message,
    });
  }
};
