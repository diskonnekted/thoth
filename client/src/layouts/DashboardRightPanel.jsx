import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";
import ErrorBoundary from "../components/ErrorBoundary";
import SchumannWaterfall from "../components/SchumannWaterfall";
import {
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardRightPanel() {
  const { spaceWeather, diagnostics, news, haarpLoading } = useData();
  const { rightPanelVisible, setRightPanelVisible } = useUI();
  const [activeTab, setActiveTab] = useState('spaceweather'); // 'spaceweather' | 'spectrogram' | 'schumann' | 'alerts'

  if (!rightPanelVisible) return null;

  const vlfData = diagnostics?.vlf || [];
  const alerts = spaceWeather?.alerts || [];

  // Helper for Kp index description
  const getKpStatus = (kp) => {
    if (kp >= 5) return { label: 'STORM (ACTIVE)', color: 'text-red-500' };
    if (kp >= 4) return { label: 'ACTIVE', color: 'text-orange-500' };
    if (kp >= 3) return { label: 'UNSETTLED', color: 'text-yellow-500' };
    return { label: 'QUIET', color: 'text-emerald-500' };
  };

  const kpStatus = getKpStatus(spaceWeather?.kp || 3.0);

  return (
    <div className="absolute md:relative inset-y-0 right-0 w-[85vw] sm:w-[350px] md:w-[350px] flex-shrink-0 bg-gradient-to-b from-[#070C18]/95 via-[#090E1C]/95 to-[#0C1222]/95 backdrop-blur-2xl border-l border-white/[0.05] flex flex-col z-40 overflow-hidden panel-slide-in-right shadow-[-15px_0_30px_rgba(0,0,0,0.6)] md:shadow-none">
      {/* Tab Header */}
      <div className="flex border-b border-white/[0.06] bg-black/30 flex-shrink-0">
        {[
          { id: "spaceweather", label: "Solar Intel", icon: "fa-sun" },
          { id: "spectrogram", label: "VLF Scan", icon: "fa-broadcast-tower" },
          { id: "schumann", label: "Schumann", icon: "fa-wave-square" },
          { id: "alerts", label: "Bulletins", icon: "fa-bell" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 text-[9px] font-heading uppercase tracking-[0.1em] flex flex-col items-center justify-center gap-1 border-none transition-all cursor-pointer outline-none relative group btn-press"
            style={{
              background: activeTab === tab.id ? "rgba(0,212,255,0.06)" : "transparent",
              color: activeTab === tab.id ? "var(--color-cyan)" : "var(--color-text-muted)",
            }}
          >
            <i className={`fa-solid ${tab.icon} text-xs ${activeTab === tab.id ? "text-[var(--color-cyan)]" : ""}`}></i>
            <span className="group-hover:text-white transition-colors">{tab.label}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 tab-active-indicator"></div>}
          </button>
        ))}
        {/* Close Button */}
        <button onClick={() => setRightPanelVisible(false)}
          className="px-3 py-3.5 text-white/15 hover:text-[var(--color-red)] transition-all cursor-pointer border-l border-white/[0.06] bg-transparent group outline-none btn-press"
          title="Close Panel"
        >
          <i className="fa-solid fa-xmark text-xs group-hover:scale-110 transition-transform"></i>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 font-mono space-y-4">
        {haarpLoading ? (
          <div className="h-full flex items-center justify-center flex-col gap-2 text-[10px] text-white/30">
            <i className="fa-solid fa-circle-notch animate-spin text-lg text-[var(--color-cyan)]" />
            <span>DOWNLINKING SPACE WEATHER DATAFEED...</span>
          </div>
        ) : (
          <ErrorBoundary name="Right Panel Content">
            {activeTab === "spaceweather" && (
              <div className="space-y-4">
                {/* KP GAUGE METRIC */}
                <div className="border border-white/[0.05] rounded bg-white/[0.01] p-4 flex flex-col items-center text-center space-y-2">
                  <div className="text-[9px] text-white/30 uppercase tracking-widest">Planetary Kp Index</div>
                  <div className="text-4xl font-bold font-mono tracking-tight text-white flex items-baseline">
                    {spaceWeather?.kp || '3.2'}
                    <span className="text-[10px] text-white/20 ml-1">/ 9</span>
                  </div>
                  <div className={`text-[8px] font-bold uppercase tracking-wider ${kpStatus.color}`}>
                    STATUS: {kpStatus.label}
                  </div>
                  {spaceWeather?.kp >= 4 && (
                    <div className="w-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[7px] py-1 px-2 rounded mt-1 flex items-center gap-1.5 justify-center">
                      <i className="fa-solid fa-triangle-exclamation animate-pulse"></i>
                      MAGNETIC FIELD FLUCTUATIONS DETECTED
                    </div>
                  )}
                </div>

                {/* GENERAL SOLAR METRICS */}
                <div className="border border-white/[0.05] rounded bg-white/[0.01] p-3.5 space-y-3">
                  <div className="border-b border-white/[0.06] pb-1.5 text-[9px] uppercase tracking-wider font-bold text-white/50">
                    Solar Telemetry
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[9px]">
                    <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                      <div className="text-white/30 mb-0.5">SOLAR WIND SPEED</div>
                      <div className="text-white font-bold">{spaceWeather?.solarWind?.speed || 420} km/s</div>
                    </div>
                    <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                      <div className="text-white/30 mb-0.5">PLASMA DENSITY</div>
                      <div className="text-white font-bold">{spaceWeather?.solarWind?.density || 4.5} p/cm³</div>
                    </div>
                    <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                      <div className="text-white/30 mb-0.5">10.7CM SOLAR FLUX</div>
                      <div className="text-white font-bold">{spaceWeather?.solarFlux || 140} SFU</div>
                    </div>
                    <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                      <div className="text-white/30 mb-0.5">SOLAR FLARE CLASS</div>
                      <div className="text-white font-bold text-[var(--color-cyan)]">{spaceWeather?.flareClass || 'C2.4'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spectrogram" && (
              <div className="space-y-4">
                {/* VLF SPECTROGRAM LINE */}
                <div className="border border-white/[0.05] rounded bg-white/[0.01] p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-wave-square text-[var(--color-cyan)]"></i> VLF Sweep (5.0 - 30.0 kHz)
                    </span>
                    <span className="text-[8px] text-white/30">RX-GAKONA</span>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={vlfData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="vlfGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="frequency" stroke="rgba(255,255,255,0.2)" fontSize={7} unit="kHz" />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={7} unit="dBm" domain={[-100, -40]} />
                        <Tooltip contentStyle={{ background: '#080F20', border: '1px solid rgba(255,255,255,0.1)', fontSize: 8 }} />
                        <Area type="monotone" dataKey="power" stroke="#8B5CF6" fill="url(#vlfGrad)" strokeWidth={1} dot={false} name="Signal Power" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[8px] text-white/40 border-t border-white/[0.04] pt-1.5 flex justify-between">
                    <span>NAA PEAK (24.0 kHz): ON</span>
                    <span>NOISE FLOOR: -95 dBm</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schumann" && (
              <div className="space-y-4">
                {/* SCHUMANN RESONANCE SPECTROGRAM */}
                <div className="border border-white/[0.05] rounded bg-white/[0.01] p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-wave-square text-[var(--color-green)]"></i> Schumann Resonance (1.0 - 40.0 Hz)
                    </span>
                    <span className="text-[8px] text-white/30">EM CAVITY RESONANCE</span>
                  </div>
                  <div className="text-[9px] text-white/50">
                    Debug - Diagnostics: {diagnostics ? "LOADED" : "NULL"}, Spectrum points: {diagnostics?.schumann?.spectrum?.length || 0}
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={diagnostics?.schumann?.spectrum || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="schumannGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="frequency" stroke="rgba(255,255,255,0.2)" fontSize={7} unit="Hz" />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={7} unit="pT" />
                        <Tooltip contentStyle={{ background: '#080F20', border: '1px solid rgba(255,255,255,0.1)', fontSize: 8 }} />
                        <Area type="monotone" dataKey="power" stroke="#10B981" fill="url(#schumannGrad)" strokeWidth={1} dot={false} name="Power density" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[7.5px] text-white/40 border-t border-white/[0.04] pt-1.5 leading-relaxed">
                    <span className="text-[var(--color-green)] font-bold">PRIMARY PEAK: 7.83 Hz</span> (Earth-Ionosphere Cavity Fundamental). Harmonics visible at 14.3Hz, 20.8Hz, 27.3Hz, 33.8Hz.
                  </div>
                </div>

                {/* SCHUMANN WATERFALL SPECTROGRAM */}
                <SchumannWaterfall spectrum={diagnostics?.schumann?.spectrum || []} />
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-3">
                {/* ALERTS / BULLETINS LIST */}
                <div className="border-b border-white/[0.06] pb-1.5 text-[10px] uppercase tracking-wider font-bold text-white/50">
                  Space Weather Bulletins
                </div>
                {news.length === 0 ? (
                  <div className="text-center text-[9px] text-white/30 py-4">NO ACTIVE BULLETINS</div>
                ) : (
                  news.map((item, idx) => (
                    <div key={idx} className="bg-black/20 p-2.5 rounded border border-white/[0.04] space-y-1.5 hover:bg-black/45 transition-colors">
                      <div className="flex items-center justify-between text-[8px]">
                        <span className="text-[var(--color-cyan)] font-bold">{item.source}</span>
                        <span className="text-white/20">{new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-[9.5px] font-bold text-white/80 leading-snug">{item.title}</div>
                      <div className="text-[8.5px] text-white/55 leading-relaxed">{item.intelSummary}</div>
                      {item.impactSectors && item.impactSectors.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-white/[0.03]">
                          {item.impactSectors.slice(0, 3).map((sec, sIdx) => (
                            <span key={sIdx} className="bg-white/5 text-white/40 text-[6.5px] uppercase py-0.5 px-1 rounded font-mono">
                              {sec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
