import React, { useState } from "react";
import FilterBar from "../components/FilterBar";
import Globe from "../components/Globe";
import Map2D from "../components/Map2D";
import ErrorBoundary from "../components/ErrorBoundary";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function DashboardCenter() {
  const { stations, spaceWeather } = useData();
  const {
    activeFilters,
    handleFilterToggle,
    timeRange,
    setTimeRange,
    viewMode,
    setViewMode,
    showFlights: showStations,
    setShowFlights: setShowStations,
    showHeatmap,
    setShowHeatmap,
    leftPanelVisible,
    setLeftPanelVisible,
    rightPanelVisible,
    setRightPanelVisible,
    filteredEvents,
    handleCountryClick,
    flyToTarget,
  } = useUI();

  // Map HAARP stations to flight-like markers for Globe/Map rendering compatibility
  const stationMarkers = React.useMemo(() => {
    return (stations || []).map((st) => ({
      ...st,
      callsign: st.name,
      aircraftType: st.type.toUpperCase(),
      heading: 0,
      isSurge: st.status === 'ACTIVE',
      isNearConflict: st.status === 'STANDBY',
      velocity: 0,
      altitude: 0,
      destLat: null,
      destLng: null,
    }));
  }, [stations]);

  // Helper for toggle button styling
  const toggleBtnClass = (active) =>
    `p-2 transition-all cursor-pointer border rounded-md w-8 h-8 flex items-center justify-center btn-press ${
      active
        ? `border-transparent`
        : "border-white/[0.06] text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
    }`;

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Filter Bar + View Controls */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto backdrop-blur-xl bg-gradient-to-b from-black/50 to-black/30 border-b border-white/[0.04] px-2 min-h-[48px] py-1 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[300px]">
            <FilterBar
              activeFilters={activeFilters}
              onToggle={handleFilterToggle}
              timeRange={timeRange}
              onTimeChange={setTimeRange}
            />
          </div>

          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0 px-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-black/30 rounded-md p-1 border border-white/[0.05]">
              <button
                onClick={() => setViewMode("globe")}
                className={`p-1.5 transition-all cursor-pointer border-none rounded-md btn-press ${viewMode === "globe" ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/[0.12]" : "text-muted hover:text-white/50"}`}
                title="3D Globe View"
              >
                <i className="fa-solid fa-earth-americas text-sm"></i>
              </button>
              <button
                onClick={() => setViewMode("map2d")}
                className={`p-1.5 transition-all cursor-pointer border-none rounded-md btn-press ${viewMode === "map2d" ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/[0.12]" : "text-muted hover:text-white/50"}`}
                title="2D Map View"
              >
                <i className="fa-solid fa-map text-sm"></i>
              </button>
            </div>

            {/* Layer toggles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowStations(!showStations)}
                className={toggleBtnClass(showStations)}
                style={showStations ? { color: 'var(--color-cyan)', background: 'rgba(0,212,255,0.12)', borderColor: 'rgba(0,212,255,0.2)' } : {}}
                title="Toggle Facility Network Overlay"
              >
                <i className="fa-solid fa-satellite-dish text-[10px]"></i>
              </button>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={toggleBtnClass(showHeatmap)}
                style={showHeatmap ? { color: '#ff4500', background: 'rgba(255,69,0,0.12)', borderColor: 'rgba(255,69,0,0.2)' } : {}}
                title="Ionospheric Scintillation Heatmap"
              >
                <i className="fa-solid fa-circle-nodes text-[10px]"></i>
              </button>
            </div>

            {/* Panel toggle */}
            <button
              onClick={() => {
                if (leftPanelVisible || rightPanelVisible) {
                  setLeftPanelVisible(false);
                  setRightPanelVisible(false);
                } else {
                  setLeftPanelVisible(true);
                  setRightPanelVisible(true);
                }
              }}
              className={`${toggleBtnClass(!leftPanelVisible && !rightPanelVisible)} ml-2`}
              style={!leftPanelVisible && !rightPanelVisible ? { color: 'var(--color-gold)', background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.2)' } : {}}
              title={leftPanelVisible || rightPanelVisible ? "Hide Side Panels" : "Show Side Panels"}
            >
              <i className={`fa-solid ${leftPanelVisible || rightPanelVisible ? "fa-eye-slash" : "fa-eye"} text-[10px]`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Globe / Map */}
      <div
        id="tactical-map-container"
        className="absolute inset-0 z-0 bg-[#040810]"
      >
        <ErrorBoundary name="Tactical Map">
          {viewMode === "globe" ? (
            <Globe
              events={filteredEvents}
              flights={stationMarkers}
              vessels={[]}
              cyber={[]}
              showFlights={showStations}
              showVessels={false}
              showCyber={false}
              showHeatmap={showHeatmap}
              onCountryClick={handleCountryClick}
              onFlightClick={(st) => console.log('Station selected:', st)}
              onVesselClick={() => {}}
              flyToTarget={flyToTarget}
            />
          ) : (
            <Map2D
              events={filteredEvents}
              flights={stationMarkers}
              vessels={[]}
              showFlights={showStations}
              showVessels={false}
              onCountryClick={handleCountryClick}
              onFlightClick={(st) => console.log('Station selected:', st)}
              onVesselClick={() => {}}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="bg-[#040810]/70 backdrop-blur-xl border border-white/[0.05] py-2.5 px-4 flex items-center gap-5 text-[9px] uppercase tracking-tighter font-mono rounded-md pointer-events-auto shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></span>
            <span className="text-white/50">Critical Anomaly</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.5)]"></span>
            <span className="text-white/50">Elevated activity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_4px_rgba(234,179,8,0.5)]"></span>
            <span className="text-white/50">Disturbance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></span>
            <span className="text-white/50">Quiet / Nominal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
