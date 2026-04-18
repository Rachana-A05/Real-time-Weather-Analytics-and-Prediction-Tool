const fs = require("fs");
const http = require("http");
const file = fs.createWriteStream("weather_report.csv");

http.get("http://127.0.0.1:5000/admin/export", (res) => {
  res.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log("✅ weather_report.csv downloaded successfully!");

    // LOG the download event after a successful download
    const logReq = http.request({
      hostname: "127.0.0.1",
      port: 5000,
      path: "/api/dashboard/logDownload",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }, (logRes) => {
      logRes.on('data', () => {}); // ignore
      logRes.on('end', () => {
        console.log("🔔 Report download event logged!");
      });
    });
    logReq.on("error", (err) => {
      console.error("❌ Failed to log download event:", err.message);
    });
    logReq.write(JSON.stringify({ event: "report_download" }));
    logReq.end();
  });
}).on("error", (err) => {
  fs.unlink("weather_report.csv", () => {});
  console.error("❌ Error downloading file:", err.message);
});
