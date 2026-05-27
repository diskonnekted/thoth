<div align="center">

# 🌌 THOTH

**Planetary Climate, Space Weather & Ionospheric Stability Command Center**

![THOTH Logo](client/public/thoth.jpg)

> **"Monitoring the subtle pulse of our planet—from Schumann Resonances in the cavity of the ionosphere to real-time space weather alerts, satellite orbits, and atmospheric telemetry. Built to democratize planetary monitoring with beautiful, responsive, and data-dense dashboards."**

<a href="#" target="_blank">
  <img src="https://img.shields.io/badge/%20Live%20Telemetry-Launch%20THOTH-00D4FF?style=for-the-badge&labelColor=0A0F1E" alt="Live Telemetry" />
</a>

[![Stack](https://img.shields.io/badge/Stack-MERN-00D4FF?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Groq AI](https://img.shields.io/badge/AI-Groq_Llama_3.3-00FF88?style=for-the-badge)](https://groq.com/)
[![WebGL](https://img.shields.io/badge/WebGL-Globe.gl-7C3AED?style=for-the-badge)](https://globe.gl/)
[![License](https://img.shields.io/badge/License-MIT-EF4444?style=for-the-badge)](/)

</div>

---

## ⚡ The Concept — What is THOTH?

**THOTH** is an advanced interactive WebGL application designed for real-time monitoring of planetary atmospheric telemetry, space weather index metrics, and geomagnetic field variations. 

By unifying data streams from USGS, NASA, NOAA, and custom telemetry nodes, THOTH visualizes the invisible layers of our planet. From tropospheric weather systems and hurricane pathways to the magnetosphere and Schumann Resonance patterns, THOTH provides a zero-tab planetary command center.

---

## ✨ Key Features

### 🌍 1. WebGL Planetary Telemetry Globe
- **Interactive 3D Visualizer**: Real-time atmospheric anomalies, solar storms, earthquakes, and active storm cells plotted as glowing, severity-coded beacons.
- **Flight & Satellite Orbits**: Interactive orbital visualization tracking active meteorological satellites and research flight paths traversing the upper atmosphere.
- **Micro-Animations**: Custom target crosshairs, live data streams, and active radar sweep animations.

### 🌊 2. Live Schumann Resonance Waterfall Diagram
- **Frequency Spectrum Monitor**: Displays the classic electromagnetic resonance of the Earth-ionosphere cavity (1.0 to 40.0 Hz).
- **Waterfall Plot**: Smooth real-time canvas-based rendering showing frequency fluctuations and power intensity spikes (peaks at ~7.83Hz, 14.3Hz, 20.8Hz, etc.).
- **Live Diagnostics**: Controls to tweak bandwidth filters and visual contrast settings.

### 🤖 3. AI Atmospheric & Climate Briefings
- **Climate Analyst Agent**: Powered by rotating Groq APIs (Llama 3.3) and Gemini fallback to generate regional briefings on current climate conditions, ionospheric interference levels, and meteorological assessments.
- **Atmospheric Stability Index**: Glowing gauges highlighting regional storm levels, geomagnetic disruption risks, and solar flux intensity.
- **Vulnerability Alerts**: Direct alerts showing climate impacts on communications, agriculture, satellite signals, and marine operations.

### 🛰️ 4. Orbiting Weather Satellite Visualizer
- **Paths & Coordinates**: Renders weather satellites orbiting in the upper atmosphere, tracking live paths and calculating coordinate telemetry.
- **Active Telemetry**: Generates sensor parameters (Ambient Temperature, Relative Humidity, Wind Velocity) mapped dynamically to standard visual graphs.

---

## 📁 Project Structure

```
THOTH/
├── client/                                  # ⚛️ React 18 + Vite Frontend
│   ├── public/
│   │   └── thoth.jpg                        # Application Logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe.jsx                    # WebGL 3D Globe with telemetry overlays
│   │   │   ├── CountryBrief.jsx             # AI Climate & Space Weather side panel
│   │   │   ├── SchumannWaterfall.jsx        # Real-time Schumann Resonance visualizer
│   │   │   ├── PageLoader.jsx               # Application loading screen with THOTH logo
│   │   │   └── TerminalLoader.jsx           # Animated console loader
│   │   ├── context/
│   │   │   └── DataContext.jsx              # Global telemetry data state
│   │   ├── hooks/
│   │   │   └── useHAARPLiveData.js          # Telemetry fetching logic
│   │   ├── index.css                        # Styling & theme configurations
│   │   └── main.jsx
│   └── vite.config.js
│
├── server/                                  # 🖥️ Node.js + Express Backend
│   ├── routes/
│   │   ├── ai.js                            # AI weather briefings & API connectors
│   │   ├── haarp.js                         # Ionospheric stability telemetry routes
│   │   └── events.js                        # Meteorological event aggregator
│   ├── index.js                             # Primary entry point
│   └── package.json
```

---

## 🛠️ Tech Stack & Integration

- **Frontend**: React 18, Vite, HSL-tailored vanilla CSS, Globe.gl, Recharts, HTML5 Canvas.
- **Backend**: Node.js, Express, Socket.io, Axios.
- **Database (Optional)**: MongoDB Atlas via Mongoose (for caching briefs).
- **APIs & Telemetry**: USGS Earthquakes, NASA EONET, NOAA Space Weather indices, Groq API (Llama 3.3), Google Gemini API.

---

## 🚀 Getting Started

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/diskonnekted/thoth.git
cd thoth

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Set up Environment Variables
Create a `.env` file in the `server` directory:
```env
GROQ_API_KEY_1=gsk_xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx
NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/thoth
PORT=5000
```

### 3. Run the Development Server
```bash
# From the root directory:
npm run dev
```
Visit `http://localhost:666` in your browser.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author
- **diskonnekted** (arif.susilo@gmail.com)
