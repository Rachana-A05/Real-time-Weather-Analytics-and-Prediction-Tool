import React, { useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/common/Navbar.js";
import Sidebar from "./components/Sidebar.jsx";
import FeaturesMenu from "./components/FeaturesMenu.js";
import Pricing from "./components/Pricing.js";
import Alerts from "./components/alerts/Alerts.js";
import Forecast from "./components/weather/NextDayForecast.js";
import WeatherTrend from "./WeatherTrend.js";
import IndiaMapWeather from './components/IndiaMapWeather';
import AQIDashboard from './components/aqi/AQIDashboard';
import HistoricalDataBackfill from './components/HistoricalDataBackfill';
import Dashboard from "./pages/Dashboard.jsx";
import ApiKey from "./pages/ApiKey.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";

// Context for dark mode
export const DarkModeContext = createContext({ darkMode: false, setDarkMode: () => {} });

function Home() {
  const navigate = useNavigate();
  const { darkMode } = useContext(DarkModeContext);

  return (
    <div
      style={{
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        background: darkMode
          ? "linear-gradient(120deg,#102133 50%,#202d49 100%)"
          : "linear-gradient(120deg,#e0f1ff 48%,#b8e6fe 100%)"
      }}
    >
      <div
        style={{
          marginTop: 60,
          background: darkMode ? "rgba(24,34,59,0.88)" : "#fffdfaee",
          boxShadow: "0 10px 32px #187bde19",
          borderRadius: 24,
          padding: "48px 38px 34px 38px",
          maxWidth: 1000,
          width: "90%",
          textAlign: "center"
        }}
      >
        <h1
          style={{
            fontSize: "2.7rem",
            fontWeight: 900,
            letterSpacing: "0.03em",
            color: darkMode ? "#46cafc" : "#1780cf",
            textShadow: darkMode
              ? "0 2px 22px #2287df77"
              : "0 2px 7px #8ecfff35"
          }}
        >
          
          
          <span style={{ fontSize: 38, fontWeight: 600 }}>India’s Weather Dashboard</span>
          <span
            aria-label="weather"
            style={{ fontSize: 54, filter: "drop-shadow(0 0 12px #8df3fb)", verticalAlign: "-12px" }}
          >🌦️</span>
        </h1>
        <p
          style={{
            fontSize: "1.33rem",
            color: darkMode ? "#c3eafd" : "#346aad",
            marginTop: 16,
            fontWeight: 600,
            letterSpacing: ".01em"
          }}
        >
          Accurate local weather, smart alerts, and AQI forecast, fast, built for India.
        </p>
        <button
          style={{
            background: "linear-gradient(90deg,#1fa2ff 20%,#17d1ba 80%)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: "1.17rem",
            padding: "17px 49px",
            fontWeight: 800,
            marginTop: 34,
            boxShadow: darkMode
              ? "0 2px 32px #67aefb44"
              : "0 4px 19px #51d0db3d",
            cursor: "pointer",
            letterSpacing: ".01em"
          }}
          onClick={() => navigate("/features")}
        >
          Explore Features
        </button>
      </div>
      {/* Weather Map */}
      <div
        style={{
          marginTop: "46px",
          width: "100%",
          maxWidth: "1060px",
          borderRadius: "21px",
          overflow: "hidden",
          boxShadow: "0 2px 34px #2ab6e522"
        }}
      >
        <IndiaMapWeather />
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <BrowserRouter>
        <div
          style={{
            background: darkMode ? "#192c43" : "",
            minHeight: "100vh",
            transition: "background .2s"
          }}
        >
          <Navbar
            setAdminSidebarOpen={setSidebarOpen}
            setAdminMode={setAdminMode}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            adminMode={adminMode}
            setAdminMode={setAdminMode}
          />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<FeaturesMenu />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/trend" element={<WeatherTrend />} />
            <Route path="/admin/backfill" element={<HistoricalDataBackfill />} />
            <Route path="/aqi-dashboard" element={<AQIDashboard />} />
            <Route path="*" element={<Home />} />
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/api-key" element={<ApiKey />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
            
          </Routes>
        </div>
      </BrowserRouter>
    </DarkModeContext.Provider>
  );
}
