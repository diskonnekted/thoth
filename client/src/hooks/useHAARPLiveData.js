import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useHAARPLiveData() {
  const [stations, setStations] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [spaceWeather, setSpaceWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStations = useCallback(async () => {
    try {
      const res = await axios.get('/api/haarp/stations');
      setStations(res.data || []);
    } catch (err) {
      console.warn('HAARP stations fetch failed:', err.message);
    }
  }, []);

  const fetchDiagnostics = useCallback(async () => {
    try {
      const res = await axios.get('/api/haarp/diagnostics');
      setDiagnostics(res.data || null);
    } catch (err) {
      console.warn('HAARP diagnostics fetch failed:', err.message);
    }
  }, []);

  const fetchSpaceWeather = useCallback(async () => {
    try {
      const res = await axios.get('/api/haarp/spaceweather');
      setSpaceWeather(res.data || null);
    } catch (err) {
      console.warn('HAARP space weather fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      fetchStations(),
      fetchDiagnostics(),
      fetchSpaceWeather()
    ]);
    setLoading(false);
  }, [fetchStations, fetchDiagnostics, fetchSpaceWeather]);

  useEffect(() => {
    refreshAll();

    // Refresh diagnostics every 10 seconds
    const diagInterval = setInterval(fetchDiagnostics, 10000);
    // Refresh space weather every 60 seconds
    const swInterval = setInterval(fetchSpaceWeather, 60000);

    return () => {
      clearInterval(diagInterval);
      clearInterval(swInterval);
    };
  }, [refreshAll, fetchDiagnostics, fetchSpaceWeather]);

  return {
    stations,
    diagnostics,
    spaceWeather,
    loading,
    refreshAll
  };
}
