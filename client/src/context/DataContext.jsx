import React, { createContext, useContext, useMemo } from 'react';
import useGlobeData from '../hooks/useGlobeData';
import useNewsData from '../hooks/useNewsData';
import useHAARPLiveData from '../hooks/useHAARPLiveData';
import useSocket from '../hooks/useSocket';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // HAARP primary data hook
  const { stations, diagnostics, spaceWeather, loading: haarpLoading, refreshAll } = useHAARPLiveData();

  // Basic feeds (adapted to Space Weather in the backend)
  const { events, loading: globeLoading } = useGlobeData();
  const { news, loading: newsLoading } = useNewsData();

  // Socket connection
  const { isConnected, serverClients, onEvent } = useSocket();

  const value = useMemo(() => ({
    // ── HAARP Live Data ───────────────────────────────────────────────────
    stations,
    diagnostics,
    spaceWeather,
    haarpLoading,
    refreshAll,

    // ── Globe/News Feeds ──────────────────────────────────────────────────
    events,
    news,
    globeLoading: globeLoading || haarpLoading,
    newsLoading: newsLoading || haarpLoading,

    // ── Mock variables for legacy layouts compat ────────────────────────
    flights: [],
    vessels: [],
    cyber: [],
    quote: null,
    signal: null,
    overview: {
      marketOverview: 'SPACE WEATHER SYSTEM ONLINE - MONITORING MAGNETOSPHERE CONDITIONS',
      marketIndices: [
        { symbol: 'KP-INDEX', price: spaceWeather?.kp || 3.2, change: 0.1, changePercent: 3.1 },
        { symbol: 'SOLAR-FLUX', price: spaceWeather?.solarFlux || 145, change: -1.5, changePercent: -1.0 },
        { symbol: 'WIND-SPD', price: spaceWeather?.solarWind?.speed || 410, change: 12, changePercent: 3.0 }
      ]
    },
    predictions: [],
    watchlist: [],
    signalHistory: [],
    signalStats: { total: 0, critical: 0, warning: 0 },
    historyLoading: false,
    fetchOverview: () => {},
    fetchPredictions: () => {},
    fetchSignalHistory: () => {},
    fetchSignalStats: () => {},
    addAutoSignals: () => {},
    setAutoWatchlist: () => {},
    sitrep: {
      summary: 'MAGNETIC FIELD MONITOR: Stable with minor high-latitude activity. Ionosphere F-layer critical frequency peaks at 6.8 MHz. HAARP transmission operations active on 3.2 MHz.',
      recommendations: [
        'Calibrate Riometers to monitor solar cosmic noise absorption fluctuations.',
        'Track HF propagation paths between Arctic observatories.',
        'Prepare all-sky cameras for auroral displays tonight.'
      ]
    },
    sitrepLoading: false,
    aiRegions: [],
    
    // ── WebSocket ──────────────────────────────────────────────────────────
    isConnected,
    serverClients,
    onEvent
  }), [
    stations,
    diagnostics,
    spaceWeather,
    haarpLoading,
    refreshAll,
    events,
    news,
    globeLoading,
    newsLoading,
    isConnected,
    serverClients,
    onEvent
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}