const express = require('express');
const router = express.Router();
const axios = require('axios');

// Global cache for current Kp index to sync Schumann resonance power
let globalKp = 3.0;


// Curated list of Ionospheric research stations
const STATIONS = [
  { id: 'st-haarp', name: 'HAARP Facility', lat: 62.3933, lng: -145.1500, type: 'transmitter', status: 'ACTIVE', freq: '3.2 MHz', location: 'Gakona, Alaska, USA' },
  { id: 'st-eiscat-tr', name: 'EISCAT Tromsø', lat: 69.5864, lng: 19.2272, type: 'transmitter', status: 'STANDBY', freq: 'N/A', location: 'Tromsø, Norway' },
  { id: 'st-sura', name: 'Sura Facility', lat: 56.1360, lng: 46.1084, type: 'transmitter', status: 'IDLE', freq: 'N/A', location: 'Vasilsursk, Russia' },
  { id: 'st-eiscat-sv', name: 'EISCAT Svalbard', lat: 78.1583, lng: 16.0378, type: 'observatory', status: 'ACTIVE', freq: 'N/A', location: 'Longyearbyen, Svalbard' },
  { id: 'st-millstone', name: 'Millstone Hill Observatory', lat: 42.6186, lng: -71.4914, type: 'observatory', status: 'ACTIVE', freq: 'N/A', location: 'Westford, Massachusetts, USA' },
  { id: 'st-jicamarca', name: 'Jicamarca Observatory', lat: -11.9520, lng: -76.8770, type: 'observatory', status: 'ACTIVE', freq: 'N/A', location: 'Lima, Peru' },
  { id: 'st-sondrestrom', name: 'Sondrestrom Facility', lat: 66.9858, lng: -50.9506, type: 'observatory', status: 'MAINTENANCE', freq: 'N/A', location: 'Kangerlussuaq, Greenland' }
];

// Helper to generate simulated noise around a base value
function generateTimeSeries(base, amplitude, points = 30) {
  const data = [];
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 min intervals
    // Use sine waves + random noise for realistic fluctuation
    const val = base + Math.sin(i / 3) * (amplitude / 2) + (Math.random() - 0.5) * (amplitude / 3);
    data.push({
      timestamp: time.toISOString().substring(11, 16),
      value: parseFloat(val.toFixed(2))
    });
  }
  return data;
}

// Generate magnetometer components (X, Y, Z in nanoTesla)
function generateMagnetometerData() {
  return {
    X: generateTimeSeries(13500, 120),
    Y: generateTimeSeries(4200, 80),
    Z: generateTimeSeries(51200, 200)
  };
}

// Generate Riometer data (Cosmic Noise Absorption in dB)
function generateRiometerData() {
  return generateTimeSeries(0.3, 0.8).map(d => ({
    ...d,
    value: Math.max(0, d.value) // Absorption is always non-negative
  }));
}

// Generate Ionosonde profile (Virtual Height km vs Frequency MHz)
function generateIonosondeData() {
  const profile = [];
  // Typical E-layer and F-layer traces
  for (let f = 1.0; f <= 7.0; f += 0.2) {
    let height = 0;
    if (f < 3.0) {
      // E-layer reflection
      height = 90 + Math.pow(f - 1, 2) * 10 + (Math.random() - 0.5) * 2;
    } else if (f >= 3.0 && f < 3.5) {
      // Valley / Transition
      height = 130 + (Math.random() - 0.5) * 5;
    } else {
      // F-layer reflection
      height = 200 + Math.pow(f - 3.5, 2) * 25 + (Math.random() - 0.5) * 5;
    }
    profile.push({
      frequency: parseFloat(f.toFixed(2)),
      height: Math.round(height)
    });
  }
  return {
    foF2: 6.8, // Critical frequency in MHz
    hF2: 320,  // Peak height in km
    profile
  };
}

// Generate VLF frequency sweep signal strength (dBm vs kHz)
function generateVLFData() {
  const signals = [];
  for (let f = 5; f <= 30; f += 0.5) {
    let power = -95 + (Math.random() - 0.5) * 3; // Noise floor
    // Add VLF transmitter peaks (e.g. NAA at 24 kHz, NPM at 21.4 kHz, etc.)
    if (Math.abs(f - 24.0) < 0.6) {
      power += 45 * (1 - Math.abs(f - 24.0) / 0.6);
    }
    if (Math.abs(f - 21.4) < 0.6) {
      power += 38 * (1 - Math.abs(f - 21.4) / 0.6);
    }
    if (Math.abs(f - 19.8) < 0.6) {
      power += 35 * (1 - Math.abs(f - 19.8) / 0.6);
    }
    signals.push({
      frequency: parseFloat(f.toFixed(1)),
      power: parseFloat(power.toFixed(1))
    });
  }
  return signals;
}

// Generate Schumann resonance spectrum (power density vs frequency in Hz)
function generateSchumannData(kpValue = 3.0) {
  const spectrum = [];
  const harmonics = [7.83, 14.3, 20.8, 27.3, 33.8];
  
  // High Kp index values (geomagnetic storms) amplify the Schumann resonance power density
  const kpMultiplier = 1.0 + (parseFloat(kpValue) || 3.0) / 4.0;
  
  for (let f = 1.0; f <= 40.0; f += 0.5) {
    let power = (5.0 + (Math.random() - 0.5) * 1.5) * kpMultiplier; // Base noise scales with Kp
    // Superimpose harmonic peaks
    harmonics.forEach((h, idx) => {
      const distance = Math.abs(f - h);
      if (distance < 2.0) {
        // Amplitude decreases for higher harmonics, but scales with Kp
        const peakAmp = ((25.0 / (idx + 1)) * (1 - distance / 2.0)) * kpMultiplier;
        power += peakAmp;
      }
    });
    spectrum.push({
      frequency: parseFloat(f.toFixed(2)),
      power: parseFloat(power.toFixed(2))
    });
  }
  return {
    fundamental: 7.83,
    spectrum
  };
}

// Endpoint: Stations list
router.get('/stations', (req, res) => {
  res.json(STATIONS);
});

// Endpoint: Combined diagnostic suite data
router.get('/diagnostics', (req, res) => {
  res.json({
    magnetometer: generateMagnetometerData(),
    riometer: generateRiometerData(),
    ionosonde: generateIonosondeData(),
    vlf: generateVLFData(),
    schumann: generateSchumannData(globalKp),
    lastUpdated: new Date().toISOString()
  });
});

// Endpoint: Space Weather telemetry from NOAA, BGS, or simulated
router.get('/spaceweather', async (req, res) => {
  try {
    // 1. Fetch real-time K-indices from British Geological Survey (BGS)
    let bgsKp = 3.0;
    let bgsAp = 5.0;
    let bgsDataAvailable = false;
    
    try {
      const bgsRes = await axios.get('https://geomag.bgs.ac.uk/data_service/space_weather/current/3hrap.json', { timeout: 4000 });
      if (bgsRes.data && Array.isArray(bgsRes.data.fields) && bgsRes.data.fields.length > 0) {
        const latestField = bgsRes.data.fields[bgsRes.data.fields.length - 1];
        bgsKp = parseFloat(latestField.kp) || 3.0;
        bgsAp = parseFloat(latestField.ap) || 5.0;
        bgsDataAvailable = true;
        console.log(`[BGS Space Weather] Retrieved current Kp: ${bgsKp}, Ap: ${bgsAp}`);
      }
    } catch (e) {
      console.warn('[BGS Space Weather] Failed to fetch BGS K-indices:', e.message);
    }

    // 2. Fetch real Space Weather Alerts and Scales from NOAA SWPC API
    const noaaAlertsPromise = axios.get('https://services.swpc.noaa.gov/json/alerts.json', { timeout: 3000 });
    const noaaKpPromise = axios.get('https://services.swpc.noaa.gov/products/noaa-scales.json', { timeout: 3000 });

    const [alertsResult, KpResult] = await Promise.allSettled([noaaAlertsPromise, noaaKpPromise]);

    let alerts = [];
    if (alertsResult.status === 'fulfilled') {
      alerts = alertsResult.value.data
        .slice(0, 5)
        .map(a => ({
          id: a.issue_datetime,
          message: a.message,
          issueTime: a.issue_datetime
        }));
    } else {
      alerts = [
        { id: 'sim-1', message: `SUMMARY: BGS Geomagnetic Observatory reporting Kp=${bgsKp}.`, issueTime: new Date().toISOString() },
        { id: 'sim-2', message: `WARNING: Geomagnetic Storm conditions at UK observatories.`, issueTime: new Date().toISOString() }
      ];
    }

    let kp = bgsDataAvailable ? bgsKp : 3.2;
    let stormG = 0;
    let solarWindSpeed = 412;
    let solarWindDensity = 4.8;
    let solarFlux = 145;

    if (!bgsDataAvailable && KpResult.status === 'fulfilled') {
      const data = KpResult.value.data;
      kp = parseFloat(data?.ScaleLevelText || 3.2) || 3.2;
      stormG = parseInt(data?.G?.Scale || 0);
    } else if (bgsDataAvailable) {
      // Calculate NOAA G-scale mapping from Kp
      if (kp >= 9) stormG = 5;
      else if (kp >= 8) stormG = 4;
      else if (kp >= 7) stormG = 3;
      else if (kp >= 6) stormG = 2;
      else if (kp >= 5) stormG = 1;
      else stormG = 0;
    }

    // Sync globalKp for Schumann resonance simulation
    globalKp = kp;

    // Map observatory-specific local K-indices based on BGS Kp
    const bgsObservatories = {
      lerwick: Math.min(9, Math.max(0, Math.round(kp * 1.1 + (Math.random() - 0.5) * 0.8))),
      eskdalemuir: Math.min(9, Math.max(0, Math.round(kp * 0.95 + (Math.random() - 0.5) * 0.5))),
      hartland: Math.min(9, Math.max(0, Math.round(kp * 0.85 + (Math.random() - 0.5) * 0.5)))
    };

    res.json({
      kp,
      ap: bgsDataAvailable ? bgsAp : kp * 4, // Estimate Ap if BGS was down
      stormG,
      observatories: bgsObservatories,
      solarWind: {
        speed: Math.round(solarWindSpeed + (Math.random() - 0.5) * 30),
        density: parseFloat((solarWindDensity + (Math.random() - 0.5) * 2).toFixed(1))
      },
      solarFlux: Math.round(solarFlux + (Math.random() - 0.5) * 10),
      flareClass: Math.random() > 0.8 ? 'M1.1' : 'C4.5',
      alerts,
      source: bgsDataAvailable ? 'British Geological Survey (BGS)' : 'NOAA Space Weather Prediction Center (SWPC)'
    });
  } catch (err) {
    res.json({
      kp: 3.0,
      ap: 12.0,
      stormG: 0,
      observatories: { lerwick: 3, eskdalemuir: 3, hartland: 2 },
      solarWind: { speed: 430, density: 5.1 },
      solarFlux: 138,
      flareClass: 'C3.1',
      alerts: [
        { id: 'sim-1', message: 'BGS Space Weather: System online, monitoring UK observatories.', issueTime: new Date().toISOString() },
        { id: 'sim-2', message: 'Geomagnetic conditions: UNSETTLED. Kp expected 3.', issueTime: new Date().toISOString() }
      ],
      source: 'Simulated Fallback'
    });
  }
});

module.exports = router;
