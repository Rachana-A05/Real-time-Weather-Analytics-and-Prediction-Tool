const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const CSV_PATH = path.join(__dirname, "subscribers.csv");

app.post("/api/subscribe", (req, res) => {
  const { contact, type } = req.body;
  if (!contact) {
    return res.status(400).json({ error: "Contact required" });
  }
  const row = `"${contact.replace(/"/g, "'")}",${type}\n`;
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, "contact,type\n");
  }
  fs.appendFileSync(CSV_PATH, row);
  res.json({ message: `Subscribed! You'll now receive alerts via ${type}.` });
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
