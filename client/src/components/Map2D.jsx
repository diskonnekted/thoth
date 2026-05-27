import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

// Remote GeoJSON source for world country boundaries (110m resolution = lightweight/fast)
const geoUrl = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

// Geopolitical conflict/alignment zone classifications.
// These drive country fill colors on the map to reflect current threat landscape.
const RED_ZONES = ['Russia', 'Iran', 'Ukraine', 'Israel', 'Palestine', 'Yemen', 'Afghanistan'];
const BLUE_ZONES = ['United States of America', 'China', 'Saudi Arabia', 'Egypt', 'Australia', 'India', 'Japan', 'United Kingdom', 'Germany'];
const ORANGE_ZONES = ['Libya', 'Chad', 'Mali', 'Mexico', 'Venezuela', 'Thailand', 'Myanmar', 'Sudan', 'Somalia', 'Iraq', 'Syria', 'Colombia'];

// Event severity → marker fill color mapping.
// Matches the global severity palette used across the dashboard.
const SEVERITY_COLORS = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#00FF88',
};

// SVG path for radio tower icon
const AIRPLANE_PATH = "M12 2c-.8 0-1.5.7-1.5 1.5c0 .5.3.9.7 1.2L7.3 18H6v2h12v-2h-1.3l-3.9-13.3c.4-.3.7-.7.7-1.2c0-.8-.7-1.5-1.5-1.5zm0 1c.3 0 .5.2.5.5s-.2.5-.5.5s-.5-.2-.5-.5s.2-.5.5-.5z";

// SVG path for vessel icon — generic ship silhouette.
// Also rotated at render time using the vessel's heading value.
const VESSEL_PATH = "M4 6 L20 6 L20 18 L16 22 L8 22 L4 18 Z";

// Returns the appropriate color for a flight marker based on threat state.
// Priority order: surge (red) > near conflict (orange) > default (cyan).
function getFlightColor(f) {
  if (f.isSurge) return '#EF4444';
  if (f.isNearConflict) return '#F97316';
  return '#00D4FF';
}

// Returns the appropriate color for a vessel marker.
// Surge vessels are highlighted red; all others use the standard green.
function getVesselColor(v) {
  if (v.isSurge) return '#EF4444';
  return '#00ff7f';
}

// Map2D — interactive 2D world map for geopolitical situational awareness.
//
// Props:
//   events      — array of geo-tagged intel events to render as severity circles
//   flights     — array of live flight objects with lat/lng/heading/callsign etc.
//   vessels     — array of live vessel objects with lat/lng/heading/callsign etc.
//   showFlights — toggle flight marker layer visibility
//   showVessels — toggle vessel marker layer visibility
//   onCountryClick — callback(countryName) fired when a country polygon is clicked
//   onFlightClick  — callback(flight) fired when a flight marker is clicked
//   onVesselClick  — callback(vessel) fired when a vessel marker is clicked
export default function Map2D({ events = [], flights = [], vessels = [], showFlights = false, showVessels = false, onCountryClick, onFlightClick, onVesselClick }) {

  // Resolves fill color for a country geography based on its zone classification.
  // Falls back to a dark neutral green for unclassified countries.
  const getGeographyColor = (geo) => {
    const name = geo.properties.ADMIN || geo.properties.NAME;
    if (RED_ZONES.includes(name)) return "#902828"; 
    if (BLUE_ZONES.includes(name)) return "#005a84"; 
    if (ORANGE_ZONES.includes(name)) return "#a67120"; 
    return "#0b3421"; 
  };

  // Memoized country geography layer.
  // Only re-renders when onCountryClick reference changes, avoiding full geography
  // reconstruction on every parent re-render (expensive with 180+ country polygons).
  const geographies = useMemo(() => (
    <Geographies geography={geoUrl}>
      {({ geographies: geos }) =>
        geos.map((geo) => (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            fill={getGeographyColor(geo)}
            stroke="rgba(0, 0, 0, 0.6)" 
            strokeWidth={0.3}
            onClick={() => {
              if (onCountryClick) {
                 const name = geo.properties.ADMIN || geo.properties.NAME;
                 onCountryClick(name);
              }
            }}
            style={{
              default: { outline: "none" },
              hover: { fill: "#00d4ff", opacity: 0.8, outline: "none", cursor: "pointer", transition: "all 0.2s" },
              pressed: { outline: "none" },
            }}
          />
        ))
      }
    </Geographies>
  ), [onCountryClick]);

  // Memoized event marker layer.
  // Filters out events without valid coordinates, then renders a severity-scaled
  // circle at each event's location. Re-computes only when the events array changes.
  const eventMarkers = useMemo(() => {
    return events.filter(e => e.lat && e.lng).map((evt, i) => (
      <Marker key={`evt-${i}`} coordinates={[evt.lng, evt.lat]}>
        <circle 
          r={evt.severity === 'CRITICAL' ? 6 : evt.severity === 'HIGH' ? 4 : 3} 
          fill={SEVERITY_COLORS[evt.severity] || SEVERITY_COLORS.MEDIUM} 
          className="transition-all duration-300"
          style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
        />
      </Marker>
    ));
  }, [events]);

  // Memoized flight marker layer.
  // Short-circuits to null when showFlights is false to skip rendering entirely.
  // Each marker is an SVG airplane rotated to the flight's current heading,
  // with a double drop-shadow glow whose color reflects the flight's threat state.
  // Includes a monospace callsign label and a native SVG <title> tooltip.
  // Click events are stopped from propagating to the country click handler.
  const flightMarkers = useMemo(() => {
    if (!showFlights) return null;
    return flights.map((f, i) => {
      const color = getFlightColor(f);
      const heading = f.heading ?? 0;

      // Glow color mirrors the flight's threat state for quick visual triage
      const glowColor = f.isSurge 
        ? 'rgba(239,68,68,0.5)' 
        : f.isNearConflict 
          ? 'rgba(249,115,22,0.4)' 
          : 'rgba(0,212,255,0.3)';

      return (
        <Marker key={`flight-${i}`} coordinates={[f.lng, f.lat]}>
          <g 
            transform={`rotate(${heading})`} 
            style={{ 
              cursor: 'pointer', 
              filter: `drop-shadow(0 0 3px ${glowColor}) drop-shadow(0 0 6px ${glowColor})`,
              transition: 'filter 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onFlightClick) onFlightClick(f);
            }}
          >
            {/* Translate to center the 24×24 airplane path on the marker coordinate */}
            <g transform="translate(-12, -12) scale(1)">
              <path 
                d={AIRPLANE_PATH} 
                fill={color} 
                stroke={color}
                strokeWidth="0.3"
                opacity="0.95"
              />
            </g>
          </g>
          {/* Callsign label — non-interactive, rendered below the icon */}
          <text 
            y={14} 
            textAnchor="middle" 
            style={{ 
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '6px', 
              fontWeight: 700, 
              fill: color, 
              opacity: 0.7,
              pointerEvents: 'none',
              textShadow: '0 0 3px rgba(0,0,0,0.8)'
            }}
          >
            {f.callsign}
          </text>
          {/* Native SVG tooltip — shown on hover by the browser */}
          <title>{`${f.callsign} | ${f.aircraftType || 'STATION'} | STATUS: ${f.isSurge ? 'ACTIVE' : f.isNearConflict ? 'STANDBY' : 'IDLE'} | ${f.location || ''}`}</title>
        </Marker>
      );
    });
  }, [flights, showFlights, onFlightClick]);

  // Memoized vessel marker layer.
  // Mirrors the flight marker pattern: short-circuits when showVessels is false,
  // rotates the vessel icon to heading, applies surge/default glow,
  // and exposes a native tooltip with vessel metadata.
  const vesselMarkers = useMemo(() => {
    if (!showVessels) return null;
    return vessels.map((v, i) => {
      const color = getVesselColor(v);
      const heading = v.heading ?? 0;
      const glowColor = v.isSurge ? 'rgba(239,68,68,0.5)' : 'rgba(0,255,127,0.3)';

      return (
        <Marker key={`vessel-${i}`} coordinates={[v.lng, v.lat]}>
          <g 
            transform={`rotate(${heading})`} 
            style={{ 
              cursor: 'pointer', 
              filter: `drop-shadow(0 0 3px ${glowColor}) drop-shadow(0 0 6px ${glowColor})`,
              transition: 'filter 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onVesselClick) onVesselClick(v);
            }}
          >
            {/* Scale 0.8 and translate to center the 20×16 vessel path on the marker */}
            <g transform="translate(-10, -10) scale(0.8)">
              <path 
                d={VESSEL_PATH} 
                fill={color} 
                stroke={color}
                strokeWidth="0.3"
                opacity="0.8"
              />
            </g>
          </g>
          {/* Native SVG tooltip with vessel callsign, type, heading, and speed */}
          <title>{`${v.callsign} | ${v.vesselType || 'Cargo'} | HDG ${Math.round(heading)}° | ${Math.round(v.speed)}kts`}</title>
        </Marker>
      );
    });
  }, [vessels, showVessels, onVesselClick]);

  return (
    // Full-bleed container with dark background matching the dashboard theme
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative" style={{ minHeight: 400, background: '#0a1016' }}>
       {/* Panel label — non-interactive, positioned top-left */}
       <div className="absolute top-4 left-4 z-10 panel px-3 py-2 pointer-events-none" style={{ background: 'rgba(10, 15, 25, 0.8)' }}>
          <p className="text-muted text-xs font-medium uppercase tracking-wider"><i className="fa-solid fa-satellite-dish mr-2"></i>HAARP Observatory Map</p>
       </div>

      {/* ComposableMap — fixed 800×400 internal coordinate space, scales to container */}
      <ComposableMap 
        projectionConfig={{ scale: 140 }} 
        style={{ width: "100%", height: "100%" }}
        width={800}
        height={400}
      >
        {/* ZoomableGroup allows pan and zoom; centered on Africa/Europe meridian */}
        <ZoomableGroup center={[20, 0]} zoom={1}>
          {geographies}
  
          {/* Render Event Markers extracted from parent state */}
          {eventMarkers}
          {flightMarkers}
          {vesselMarkers}
        </ZoomableGroup>
      </ComposableMap>

      {/* Bottom hint badge — guides user to interact with the map */}
      <div className="absolute bottom-6 px-4 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
         <span className="text-[10px] text-muted font-mono uppercase tracking-widest">Hover over stations to view active operational frequency</span>
      </div>
    </div>
  );
}