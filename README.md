# Real-time Weather Analytics and Prediction Tool - Team 4Cast ⛅

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/pestechnology/PESU_RR_AIML_D_P23_Real_time_Weather_Analytics_and_Prediction_Tool_Team-4Cast)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node-Backend-green)](https://nodejs.org/)

## 📋 Project Details

**Course:** UE23CS341A - Software Engineering  
**Institution:** PES University (PESU)  
**Section:** RR AIML - Section D  
**Team Name:** Team 4Cast  
**Academic Year:** 2025 (5th Semester)  
**Project ID:** P23

## 📖 Description

An advanced weather application that provides real-time weather analytics, predictions, and comprehensive weather insights for locations across India. The application combines modern web technologies with weather data APIs to deliver an intuitive and feature-rich user experience.

## ✨ Features

### 🌤️ Core Weather Features
- **Real-time Weather Data**: Get current weather conditions for any location
- **Weather Forecasting**: View detailed weather predictions
- **Historical Data**: Access and analyze historical weather patterns
- **Interactive India Map**: Visualize weather data across Indian states

### 🚨 Alert System
- **Extreme Weather Alerts**: Real-time notifications for severe weather conditions
- **State-wise Alert Mapping**: Geographic visualization of weather alerts
- **Custom Alert Configuration**: Set personalized weather alert thresholds

### 📊 Analytics & Reporting
- **Air Quality Index (AQI)**: Monitor air pollution levels
- **Weather Charts**: Interactive visualizations of weather trends
- **Historical Data Analysis**: Backfill and analyze past weather data
- **Custom Reports**: Generate detailed weather reports

### 💻 User Experience
- **Responsive Design**: Seamless experience across all devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Animated Transitions**: Smooth page transitions and animations
- **Interactive Dashboard**: Comprehensive weather dashboard with cards and widgets

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18.3.1
- **Routing:** React Router DOM 6.22.3
- **UI Components:** 
  - Material-UI (MUI) 7.3.5
  - Emotion (Styled Components)
  - Framer Motion (Animations)
  - Lucide React (Icons)
- **Charts & Visualization:**
  - Chart.js 4.5.1
  - Recharts 3.3.0
  - React Simple Maps 3.0.0
  - D3-Geo 3.1.1
- **3D Graphics:** 
  - Three.js 0.181.0
  - React Three Fiber 8.13.9
- **Styling:** 
  - TailwindCSS 2.2.19
  - PostCSS 8.5.6

### Backend
- **Runtime:** Node.js
- **HTTP Client:** Axios 1.13.2
- **Real-time Communication:** Socket.io Client 4.8.1
- **Environment Management:** dotenv 17.2.3

### Testing
- **Framework:** Jest 27.5.1
- **React Testing:** @testing-library/react 16.3.0
- **Test Environment:** jsdom

### DevOps
- **CI/CD:** GitHub Actions (configured)
- **Version Control:** Git/GitHub

## 📁 Project Structure

```plaintext
PESU_RR_AIML_D_P23_Real_time_Weather_Analytics_and_Prediction_Tool_Team-4Cast/
│
├── .github/                        # GitHub Actions workflows
│   ├── workflows/
│   │   └── ci-cd.yml               # CI/CD configuration
│   └── CODEOWNERS
│
├── .vscode/                        # VS Code settings
│   └── settings.json
│
├── backend/                        # Backend server files
│   ├── app.py                      # Flask backend main file
│   ├── requirements.txt            # Python dependencies
│   └── weather_history.csv         # Historical weather data
│
├── frontend/
|   ├── _mocks_/                   # React frontend application
│   ├── public/                     # Public assets
│   │   ├── avatar.jpeg
│   │   ├── index.html
│   │   ├── india-map.jpeg
│   │   ├── india.glb
│   │   ├── manifest.json
│   │   └── weather-bg.jpeg
│   │
│   └── src/                        # Source files
│       ├── components/             # Reusable UI components
│       ├── _tests_/                  # Jest test cases (unit & integration)
│       ├── assets/
│       ├── hooks/
│       ├── pages
│       ├── public/
│       ├── services/
│       ├── App.cs
│       ├── App.js
│       ├── WeatherTrend.js
│       ├── index.css
│       ├── index.js
│       ├── setupTests.js
│       
│
├── .gitignore                      # Git ignore rules
└── weather_report.csv              # Weather report data

```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository**
```
git clone https://github.com/pestechnology/PESU_RR_AIML_D_P23_Real_time_Weather_Analytics_and_Prediction_Tool_Team-4Cast.git
cd PESU_RR_AIML_D_P23_Real_time_Weather_Analytics_and_Prediction_Tool_Team-4Cast
```



2. **Install Frontend Dependencies**
```
cd frontend
npm install
```


3. **Install Backend Dependencies**
```
cd ../backend
npm install
```


4. **Configure Environment Variables**
```
Create a `.env` file in both frontend and backend directories:
```
**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEATHER_API_KEY=your_weather_api_key
```


**Backend (.env)**
```
PORT=5000
WEATHER_API_KEY=your_weather_api_key
```


### Running the Application

1. **Start the Backend Server**
```
cd backend
npm start
```

2. **Start the Frontend Development Server**
```
cd frontend
npm start
```

3. **Access the Application**
Open your browser and navigate to `http://localhost:3000`


### Running Tests

Run all tests
```
cd frontend
npm test
```

Run tests in watch mode
```
npm run test:watch
```
Generate coverage report
```
npm run test:coverage
```

Run tests with verbose output
```
npm run test:verbose
```

### Build for Production
```
cd frontend
npm run build
```

The optimized production build will be created in the `frontend/build` directory.

## 📊 Key Components

### Frontend Components

#### Weather Components
- `HomePage.js` - Main landing page
- `IndiaMapWeather.js` - Interactive weather map of India
- `WeatherChart.jsx` - Weather data visualization charts
- `StatewiseAlertMap.js` - State-wise weather alert mapping

#### Alert Components
- `ExtremeWeatherAlerts.jsx` - Extreme weather notification system
- Alert configuration and management

#### AQI Components
- Air quality index monitoring
- AQI data visualization

#### Common Components
- `Sidebar.jsx` - Navigation sidebar
- `StartNavbar.jsx` - Application navbar
- `Modal.jsx` - Reusable modal component
- `Toast.jsx` - Toast notification system
- `ThemeToggle.jsx` - Dark/light theme switcher
- `AnimatedPage.jsx` - Page transition animations
- `DashboardCard.jsx` - Dashboard widget cards

#### Report Components
- `HistoricalDataBackfill.js` - Historical data management
- Weather report generation

## 👥 Team Members - Team 4Cast

| Name | GitHub | PES ID |
|------|--------|--------|
| Rachana A | [@pes1ug23am223-RachanaA](https://github.com/pes1ug23am223-RachanaA) | PES1UG23AM223 |
| Nidhi | [@pes1ug23am185-Nidhi](https://github.com/pes1ug23am185-Nidhi) | PES1UG23AM185 |
| Priyanka M P | [@priyankamp-218](https://github.com/priyankamp-218) | PES1UG23AM218 |
| Revathi A N  | [@PES1UG23AM233-REVATHI](https://github.com/PES1UG23AM233-REVATHI) | PES1UG23AM233 |

## 🔄 CI/CD Pipeline

The project includes automated CI/CD workflows configured in `.github/workflows/ci-cd.yml` for:
- Automated testing on push/pull requests
- Code quality checks
- Build verification
- Deployment automation

## 📝 Development Guidelines

### Code Style
- Follow React best practices and hooks guidelines
- Use functional components with hooks
- Maintain consistent code formatting
- Write meaningful component and variable names

### Testing
- Write unit tests for all components
- Maintain test coverage above 80%
- Test edge cases and error scenarios

### Git Workflow
- Create feature branches from `develop`
- Submit pull requests for code review
- Merge to `main` only after approval
- Follow conventional commit messages

## 🐛 Known Issues & Future Enhancements

### Planned Features
- [ ] Machine learning-based weather prediction
- [ ] Multi-language support
- [ ] Mobile application
- [ ] Weather widget API for third-party integration
- [ ] Social sharing of weather reports

## 📄 License

This project is an academic project for PES University and is intended for educational purposes.

## 🙏 Acknowledgments

- PES University Faculty - Software Engineering Department
- Weather API providers
- Open-source community for libraries and tools
- Team 4Cast members for their dedication and collaboration

## 📧 Contact

For queries related to this project, please contact the team members through their respective GitHub profiles or raise an issue in the repository.

---

**Project Repository:** [GitHub Link](https://github.com/pestechnology/PESU_RR_AIML_D_P23_Real_time_Weather_Analytics_and_Prediction_Tool_Team-4Cast)

**Course Code:** UE23CS341A  
**Institution:** PES University - RR Campus 
**Department:** AIML - Section D  
**Year:** 2025 (5th Semester)
