import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  AreaChart, Area,
  LineChart, Line,
  ScatterChart, Scatter,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardLeftPanel() {
  const { diagnostics, haarpLoading } = useData();
  const { leftPanelVisible, setLeftPanelVisible } = useUI();
  const [leftTab, setLeftTab] = useState('diagnostics'); // 'diagnostics' | 'ionogram'

  if (!leftPanelVisible) return null;

  const magnetometerData = diagnostics?.magnetometer;
  const riometerData = diagnostics?.riometer;
  const ionosondeData = diagnostics?.ionosonde;

  // Format magnetometer data for chart (combine X, Y, Z by timestamp index)
  const formattedMagData = [];
  if (magnetometerData?.X) {
    for (let i = 0; i < magnetometerData.X.length; i++) {
      formattedMagData.push({
        time: magnetometerData.X[i].timestamp,
        X: magnetometerData.X[i].value,
        Y: magnetometerData.Y?.[i]?.value || 0,
        Z: magnetometerData.Z?.[i]?.value || 0,
      });
    }
  }

  return (
    <div className="absolute md:relative inset-y-0 left-0 w-[85vw] sm:w-[350px] md:w-[350px] flex-shrink-0 bg-gradient-to-b from-[#040A16]/95 via-[#060C18]/95 to-[#0A1020]/95 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col z-40 overflow-hidden panel-slide-in-left shadow-2xl md:shadow-none">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/[0.06] bg-black/30 flex-shrink-0">
        {[
          { id: 'diagnostics', label: 'HAARP Diagnostics', icon: 'fa-gauge' },
          { id: 'ionogram', label: 'Ionogram Trace', icon: 'fa-wave-square' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setLeftTab(tab.id)}
            className="flex-1 py-3 text-[9px] font-heading uppercase tracking-[0.1em] flex flex-col items-center justify-center gap-1 border-none transition-all cursor-pointer outline-none relative group btn-press"
            style={{
              background: leftTab === tab.id ? 'rgba(0,212,255,0.06)' : 'transparent',
              color: leftTab === tab.id ? 'var(--color-cyan)' : 'var(--color-text-muted)',
            }}>
            <i className={`fa-solid ${tab.icon} text-xs ${leftTab === tab.id ? 'text-[var(--color-cyan)]' : ''}`} />
            <span className="group-hover:text-white transition-colors">{tab.label}</span>
            {leftTab === tab.id && <div className="absolute bottom-0 left-0 right-0 tab-active-indicator" />}
          </button>
        ))}
        {/* Close */}
        <button onClick={() => setLeftPanelVisible(false)}
          className="px-3 py-3 text-white/15 hover:text-[var(--color-red)] transition-all cursor-pointer border-l border-white/[0.06] bg-transparent group outline-none btn-press"
          title="Close Panel">
          <i className="fa-solid fa-xmark text-xs group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {haarpLoading ? (
          <div className="h-full flex items-center justify-center flex-col gap-2 font-mono text-[10px] text-white/30">
            <i className="fa-solid fa-spinner animate-spin text-lg text-[var(--color-cyan)]" />
            <span>AGGREGATING SENSOR FEEDS...</span>
          </div>
        ) : (
          <ErrorBoundary name="Left Panel Content">
            {leftTab === 'diagnostics' && (
              <div className="space-y-4 font-mono">
                {/* MAGNETOMETER SECTION */}
                <div className="border border-white/[0.05] rounded bg-white/[0.01] p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-compass text-[var(--color-cyan)]"></i> Fluxgate Magnetometer
                    </span>
                    <span className="text-[8px] text-white/30">GAKONA, AK</span>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedMagData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={7} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={7} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ background: '#080F20', border: '1px solid rgba(255,255,255,0.1)', fontSize: 8 }} />
                        <Line type="monotone" dataKey="X" stroke="#EF4444" strokeWidth={1} dot={false} name="X (North)" />
                        <Line type="monotone" dataKey="Y" stroke="#10B981" strokeWidth={1} dot={false} name="Y (East)" />
                        <Line type="monotone" dataKey="Z" stroke="#3B82F6" strokeWidth={1} dot={false} name="Z (Down)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-[7px] text-white/40 border-t border-white/[0.04] pt-1.5">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full"></span> X: {formattedMagData[formattedMagData.length-1]?.X} nT</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></span> Y: {formattedMagData[formattedMagData.length-1]?.Y} nT</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full"></span> Z: {formattedMagData[formattedMagData.length-1]?.Z} nT</span>
                  </div>
                </div>

                {/* RIOMETER SECTION */}
                <div className="border border-white/[0.05] rounded bg-white/[0.01] p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-satellite-dish text-[var(--color-cyan)]"></i> Riometer (30 MHz Absorption)
                    </span>
                    <span className="text-[8px] text-white/30">24-HR RECORD</span>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={riometerData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="riometerGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.2)" fontSize={7} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={7} unit="dB" />
                        <Tooltip contentStyle={{ background: '#080F20', border: '1px solid rgba(255,255,255,0.1)', fontSize: 8 }} />
                        <Area type="monotone" dataKey="value" stroke="var(--color-cyan)" fill="url(#riometerGrad)" strokeWidth={1} dot={false} name="Absorption" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[7px] text-white/40 flex justify-between border-t border-white/[0.04] pt-1.5">
                    <span>CURRENT RATIO: {riometerData?.[riometerData.length - 1]?.value} dB</span>
                    <span>THRESHOLD: &lt; 1.5 dB (Quiet)</span>
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'ionogram' && (
              <div className="space-y-4 font-mono">
                {/* IONOSONDE SCATTER TRACE */}
                <div className="border border-white/[0.05] rounded bg-white/[0.01] p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-chart-line text-[var(--color-cyan)]"></i> Digital Ionogram
                    </span>
                    <span className="text-[8px] text-white/30">E- & F-Layer Profile</span>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis type="number" dataKey="frequency" name="Frequency" unit="MHz" stroke="rgba(255,255,255,0.2)" fontSize={7} domain={[1.0, 8.0]} />
                        <YAxis type="number" dataKey="height" name="Virtual Height" unit="km" stroke="rgba(255,255,255,0.2)" fontSize={7} domain={[50, 450]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#080F20', border: '1px solid rgba(255,255,255,0.1)', fontSize: 8 }} />
                        <Scatter name="Ionosphere echo" data={ionosondeData?.profile} fill="var(--color-cyan)" line={false} shape="circle" lineJointType="monotone" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[8px] border-t border-white/[0.04] pt-2">
                    <div className="bg-black/30 p-1.5 rounded border border-white/[0.03] text-center">
                      <div className="text-white/30 mb-0.5">foF2 (CRIT FREQ)</div>
                      <div className="text-white font-bold text-[10px]">{ionosondeData?.foF2} MHz</div>
                    </div>
                    <div className="bg-black/30 p-1.5 rounded border border-white/[0.03] text-center">
                      <div className="text-white/30 mb-0.5">hF2 (PEAK HEIGHT)</div>
                      <div className="text-white font-bold text-[10px]">{ionosondeData?.hF2} km</div>
                    </div>
                  </div>
                </div>

                {/* HELPFUL LEGEND */}
                <div className="text-[8px] text-white/40 leading-relaxed bg-black/20 p-2.5 rounded border border-white/[0.03]">
                  <strong className="text-white/60">IONOGRAM EXPLANATION:</strong><br />
                  The points indicate reflecting heights of pulsed radio wave sweeps. Reflections below 120km show the E-layer, while the higher curves show the F-layer. A critical frequency (foF2) of {ionosondeData?.foF2} MHz indicates the maximum frequency that will reflect back to Earth.
                </div>
              </div>
            )}
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
