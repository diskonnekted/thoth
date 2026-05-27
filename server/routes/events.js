/**
 * @file events.js
 * @route GET /api/events
 * @description Aggregates real-time geopolitical, conflict, and natural disaster events
 *              from multiple live data sources (USGS, NASA EONET). Falls back to a
 *              curated demo dataset when live sources return insufficient data.
 *              Results are cached for 15 minutes to reduce upstream API load.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');

/**
 * Fallback demo dataset used when live APIs return fewer than 6 events.
 * Each entry represents a globally significant geopolitical or natural event
 * with coordinates, severity classification, and event type metadata.
 *
 * @type {Array<{
 *   id: string,
 *   title: string,
 *   lat: number,
 *   lng: number,
 *   severity: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW',
 *   type: string,
 *   country: string,
 *   iso2: string
 * }>}
 */
const DEMO_EVENTS = [
  { id: 'haarp-1',  title: 'HAARP HF Transmitter Campaign Active',     lat: 62.3933, lng: -145.1500, severity: 'CRITICAL', type: 'campaign',     country: 'United States', iso2: 'us' },
  { id: 'haarp-2',  title: 'EISCAT Ionospheric Heating Campaign',       lat: 69.5864, lng: 19.2272,   severity: 'HIGH',     type: 'campaign',     country: 'Norway',        iso2: 'no' },
  { id: 'haarp-3',  title: 'Sura Facility Diagnostic Run',              lat: 56.1360, lng: 46.1084,   severity: 'MEDIUM',   type: 'campaign',     country: 'Russia',        iso2: 'ru' },
  { id: 'haarp-4',  title: 'Geomagnetic Storm Kp-7 (Strong) Alert',     lat: 78.1583, lng: 16.0378,   severity: 'CRITICAL', type: 'aurora',       country: 'Svalbard',      iso2: 'sj' },
  { id: 'haarp-5',  title: 'Total Electron Content (TEC) Disturbance',  lat: 42.6186, lng: -71.4914,  severity: 'HIGH',     type: 'disturbance',  country: 'United States', iso2: 'us' },
  { id: 'haarp-6',  title: 'Sudden Ionospheric Disturbance (SID) Event',lat: -11.9520,lng: -76.8770,  severity: 'MEDIUM',   type: 'disturbance',  country: 'Peru',          iso2: 'pe' },
  { id: 'haarp-7',  title: 'El Niño Warm Phase Anomaly Active',        lat: -0.5000, lng: -120.0000, severity: 'CRITICAL', type: 'disaster',    country: 'Pacific Ocean', iso2: 'global' },
  { id: 'haarp-8',  title: 'Madden-Julian Oscillation (MJO) Pulse',     lat: -5.0000, lng: 80.0000,   severity: 'HIGH',     type: 'disaster',    country: 'Indian Ocean',  iso2: 'global' },
  { id: 'haarp-9',  title: 'Super Typhoon Warning: Category 5 Alert',   lat: 15.2000, lng: 125.5000,  severity: 'CRITICAL', type: 'disaster',    country: 'Philippines',   iso2: 'ph' },
  { id: 'haarp-10', title: 'Solar Radiation Storm (S3 Strong) Event',   lat: 80.0000, lng: -100.0000, severity: 'CRITICAL', type: 'disturbance', country: 'North Pole',    iso2: 'global' }
];

/**
 * Derives a severity level from raw event text using keyword heuristics.
 * Matches the most dangerous keywords first (CRITICAL → HIGH → MEDIUM → LOW).
 *
 * @param {string} text - Event title or description to evaluate.
 * @returns {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} Computed severity level.
 */
function scoreSeverity(text) {
  const t = (text || '').toLowerCase();
  if (/critical|storm|kp-9|x-class|blackout|disturbance/.test(t)) return 'CRITICAL';
  if (/warning|kp-6|kp-7|m-class|eruption|earthquake/.test(t))    return 'HIGH';
  if (/alert|kp-5|c-class|active|wildfire/.test(t))               return 'MEDIUM';
  return 'LOW';
}

/**
 * Classifies an event into a predefined category based on keyword matching.
 * Categories are checked in priority order: natural disasters first, then
 * space weather and research classifications.
 *
 * @param {string} text - Event title or description to classify.
 * @returns {'earthquake'|'wildfire'|'disaster'|'aurora'|'disturbance'|'campaign'} Event category.
 */
function classifyEvent(text) {
  const t = (text || '').toLowerCase();
  if (/earthquake|quake|seismic/.test(t))                              return 'earthquake';
  if (/wildfire|fire|blaze/.test(t))                                   return 'wildfire';
  if (/flood|tsunami|hurricane|typhoon|cyclone|storm|volcano/.test(t)) return 'disaster';
  if (/aurora|northern lights|solar wind/.test(t))                     return 'aurora';
  if (/ionosphere|tec|sid|disturbance/.test(t))                        return 'disturbance';
  if (/transmitter|haarp|heating|eiscat|sura|campaign/.test(t))        return 'campaign';
  return 'disturbance';
}

/**
 * Fetches active natural disaster events from NASA's Earth Observatory
 * Natural Event Tracker (EONET) API v3.
 *
 * Retrieves up to 20 open events from the past 7 days, normalising each
 * into the shared event schema. Events without geometry are discarded.
 *
 * @async
 * @returns {Promise<Array>} Normalised array of natural event objects,
 *                           or an empty array if the request fails.
 */
async function fetchEONET() {
  try {
    const res = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
      params: { limit: 20, days: 7, status: 'open' },
      timeout: 8000
    });

    const events = res.data?.events || [];
    console.log(`[events] EONET returned ${events.length} natural events`);

    return events
      .map((e, i) => {
        const geo = e.geometry?.[0];
        // Skip events that lack coordinate data — they cannot be plotted on the map
        if (!geo?.coordinates) return null;
        return {
          id:       `eonet_${i}`,
          title:    e.title || 'Natural Event',
          lat:      geo.coordinates[1],
          lng:      geo.coordinates[0],
          severity: 'HIGH',
          type:     classifyEvent(e.title || e.categories?.[0]?.title || ''),
          country:  '',
          iso2:     '',
          source:   'NASA EONET'
        };
      })
      .filter(Boolean); // Remove nulls from events with missing geometry
  } catch (err) {
    console.warn('[events] EONET fetch failed:', err.message);
    return [];
  }
}

/**
 * Fetches recent earthquakes (magnitude ≥ 2.5) from the USGS
 * Earthquake Hazards Program GeoJSON feed.
 *
 * Severity is computed from magnitude:
 *  - mag ≥ 6.0  → CRITICAL
 *  - mag ≥ 4.5  → HIGH
 *  - mag < 4.5  → MEDIUM
 *
 * @async
 * @returns {Promise<Array>} Array of up to 20 normalised earthquake event objects,
 *                           or an empty array if the request fails.
 */
async function fetchUSGS() {
  try {
    const res = await axios.get(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
      { timeout: 10000 }
    );
    const features = res.data?.features || [];
    const events = features.slice(0, 20).map((f, i) => ({
      id:       `usgs_${i}`,
      title:    f.properties?.title || 'Earthquake',
      lat:      f.geometry?.coordinates?.[1] || 0,
      lng:      f.geometry?.coordinates?.[0] || 0,
      severity: f.properties?.mag >= 6   ? 'CRITICAL'
              : f.properties?.mag >= 4.5 ? 'HIGH'
              : 'MEDIUM',
      type:     'earthquake',
      country:  (f.properties?.place || '').split(', ').pop() || '',
      iso2:     '',
      source:   'USGS'
    }));
    console.log(`[events] USGS returned ${events.length} earthquakes`);
    return events;
  } catch (err) {
    console.warn('[events] USGS fetch failed:', err.message);
    return [];
  }
}

/**
 * GET /api/events
 *
 * Returns a merged list of live global events from USGS and NASA EONET.
 * Both sources are fetched concurrently via Promise.allSettled, ensuring
 * a partial failure in one source does not block the other.
 *
 * Response is cached for 15 minutes (TTL = 900,000 ms) to avoid
 * hammering upstream APIs on every client request.
 *
 * Falls back to DEMO_EVENTS if live sources collectively return ≤ 5 events,
 * guaranteeing the map is never rendered empty.
 *
 * @name GET /api/events
 * @returns {200} JSON array of event objects
 * @returns {200} Falls back to DEMO_EVENTS on any unhandled error — never 500s
 */
router.get('/', async (req, res) => {
  try {
    // Serve from cache if a recent fetch is available
    const cached = cache.get('events');
    if (cached) return res.json(cached);

    // Fetch both sources concurrently; allSettled prevents one failure from
    // blocking the other — each result is checked individually below
    const [usgs, eonet] = await Promise.allSettled([
      fetchUSGS(),
      fetchEONET()
    ]);

    const events = [
      ...(usgs.status  === 'fulfilled' ? usgs.value  : []),
      ...(eonet.status === 'fulfilled' ? eonet.value : []),
    ];

    console.log(`[events] Total live events: ${events.length}`);

    // Fall back to demo data if live APIs returned too few events to be useful
    const result = events.length > 5 ? events : DEMO_EVENTS;
    cache.set('events', result, 15 * 60 * 1000); // Cache TTL: 15 minutes
    res.json(result);
  } catch (err) {
    // Last-resort fallback: always return something renderable, never a 500
    console.error('[events] Error:', err.message);
    res.json(DEMO_EVENTS);
  }
});

module.exports = router;