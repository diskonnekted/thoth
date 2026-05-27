const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');

const DEMO_NEWS = [
  {
    title: 'Solar Flare: M2.4 Class Flare Detected',
    source: 'NOAA SWPC',
    severity: 'HIGH',
    url: 'https://www.swpc.noaa.gov',
    publishedAt: new Date().toISOString(),
    iso2: 'us',
    region: 'Solar Disk',
    isBreaking: true,
    tacticalId: '#SW-1082',
    confidence: 99,
    intelSummary: 'An M2.4 class solar flare erupted from Active Region 3685, causing a temporary radio blackout over the Pacific region. High-frequency communication networks experienced attenuation.',
    escalationRisk: 'MEDIUM',
    impactSectors: ['Satellite Communications', 'Aviation', 'HF Radio Ops'],
    affectedCountries: ['us', 'ca', 'au'],
    relatedEvents: 'Correlated with active region AR3685 sunspot group fluctuations.',
    actionableInsight: 'Monitor 10-30 MHz channels for signal degradation. Adjust VLF receivers to record sudden ionospheric disturbances.'
  },
  {
    title: 'Geomagnetic Storm G1 (Minor) Warning Active',
    source: 'NASA CCMC',
    severity: 'MEDIUM',
    url: 'https://ccmc.gsfc.nasa.gov',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    iso2: 'no',
    region: 'Ionosonde Svalbard',
    isBreaking: false,
    tacticalId: '#SW-1083',
    confidence: 95,
    intelSummary: 'A coronal mass ejection (CME) shock passage is anticipated to trigger a G1 geomagnetic storm. Aurora visible at high latitudes.',
    escalationRisk: 'LOW',
    impactSectors: ['Power Grids', 'Satellite Navigation', 'Aurora Cam Networks'],
    affectedCountries: ['no', 'ca', 'ru'],
    relatedEvents: 'Originates from CME associated with solar filament eruption.',
    actionableInsight: 'Track magnetometer variance. Expect auroral displays above 60 degrees geomagnetic latitude.'
  },
  {
    title: 'HAARP Campaign Scheduled: Ionospheric Heating Run',
    source: 'HAARP Facility',
    severity: 'CRITICAL',
    url: 'https://haarp.gi.alaska.edu',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    iso2: 'us',
    region: 'Gakona, Alaska',
    isBreaking: true,
    tacticalId: '#HP-2090',
    confidence: 100,
    intelSummary: 'The High-frequency Active Auroral Research Program has announced a 4-day research campaign. Transmitter operations will run between 2.8 and 10 MHz to study artificial airglow and plasma ducting.',
    escalationRisk: 'LOW',
    impactSectors: ['Ionospheric Research', 'VLF/ELF Radio Science', 'Amateur HF Radio'],
    affectedCountries: ['us', 'ca'],
    relatedEvents: 'Coordinated with Poker Flat Research Range sounding rocket launch.',
    actionableInsight: 'Tune receivers to active HAARP campaign freqs. Log local magnetometer and riometer data for anomalies.'
  },
  {
    title: 'EISCAT 3D Radar System Enters Testing Phase',
    source: 'EISCAT Association',
    severity: 'LOW',
    url: 'https://eiscat.se',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    iso2: 'se',
    region: 'Tromsø / Kiruna',
    isBreaking: false,
    tacticalId: '#HP-2091',
    confidence: 98,
    intelSummary: 'The new multi-station EISCAT 3D radar system in northern Scandinavia has initiated trial atmospheric profiling. Full operations will enable 3D ionospheric wind tracking.',
    escalationRisk: 'LOW',
    impactSectors: ['Atmospheric Science', 'Space Debris Tracking'],
    affectedCountries: ['se', 'no', 'fi'],
    relatedEvents: 'Bilateral coordination with European Space Agency (ESA).',
    actionableInsight: 'Monitor radar diagnostic logs for atmospheric backscatter density coefficients.'
  }
];

// GET /api/news
router.get('/', async (req, res) => {
  try {
    // Attempt to pull real alert news or fallback to DEMO
    const cached = cache.get('news');
    if (cached) return res.json(cached);

    // Try fetching from NOAA alerts JSON endpoint for dynamic items
    try {
      const response = await axios.get('https://services.swpc.noaa.gov/json/alerts.json', { timeout: 3000 });
      if (response.data && response.data.length > 0) {
        const noaaItems = response.data.slice(0, 5).map((a, i) => ({
          title: a.message.split('\n')[0] || 'Space Weather Bulletin',
          source: 'NOAA SWPC',
          severity: a.message.includes('WARNING') ? 'HIGH' : 'MEDIUM',
          url: 'https://www.swpc.noaa.gov',
          publishedAt: a.issue_datetime,
          iso2: 'us',
          region: 'Global Ionosphere',
          isBreaking: a.message.includes('WARNING'),
          tacticalId: `#SW-N${i}`,
          confidence: 100,
          intelSummary: a.message.substring(0, 200) + '...',
          escalationRisk: 'LOW',
          impactSectors: ['Communications', 'Navigation'],
          affectedCountries: ['us'],
          relatedEvents: 'Space Weather Alert Feed',
          actionableInsight: 'Read full alert details for magnetic/ionospheric indices.'
        }));
        
        const merged = [...noaaItems, ...DEMO_NEWS];
        cache.set('news', merged, 10 * 60 * 1000);
        return res.json(merged);
      }
    } catch (e) {
      // ignore and use demo news
    }

    cache.set('news', DEMO_NEWS, 10 * 60 * 1000);
    res.json(DEMO_NEWS);
  } catch (err) {
    res.json(DEMO_NEWS);
  }
});

module.exports = router;
