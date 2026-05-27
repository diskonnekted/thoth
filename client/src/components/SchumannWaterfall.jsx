import React, { useRef, useEffect, useState } from 'react';

// Color map: maps normalized power (0 to 1) to standard spectrogram colors
// Black -> Dark Blue -> Purple -> Red -> Yellow -> White
function getSpectrogramColor(value) {
  const norm = Math.min(1, Math.max(0, value));
  if (norm < 0.2) {
    // Black to Dark Blue
    const b = Math.round((norm / 0.2) * 150);
    return `rgb(0,0,${b})`;
  } else if (norm < 0.45) {
    // Dark Blue to Purple/Red
    const r = Math.round(((norm - 0.2) / 0.25) * 180);
    const b = 150 + Math.round(((norm - 0.2) / 0.25) * 105);
    return `rgb(${r},0,${b})`;
  } else if (norm < 0.7) {
    // Purple to Orange/Red
    const r = 180 + Math.round(((norm - 0.45) / 0.25) * 75);
    const g = Math.round(((norm - 0.45) / 0.25) * 120);
    const b = 255 - Math.round(((norm - 0.45) / 0.25) * 255);
    return `rgb(${r},${g},${b})`;
  } else if (norm < 0.9) {
    // Orange to Yellow
    const r = 255;
    const g = 120 + Math.round(((norm - 0.7) / 0.2) * 135);
    const b = 0;
    return `rgb(${r},${g},${b})`;
  } else {
    // Yellow to White
    const r = 255;
    const g = 255;
    const b = Math.round(((norm - 0.9) / 0.1) * 255);
    return `rgb(${r},${g},${b})`;
  }
}

export default function SchumannWaterfall({ spectrum = [] }) {
  const canvasRef = useRef(null);
  const [history, setHistory] = useState([]);
  const maxHistoryRows = 80; // height of the waterfall scrolling rows

  // Feed new spectrum line into history buffer
  useEffect(() => {
    if (spectrum.length === 0) return;
    setHistory(prev => {
      const next = [spectrum, ...prev];
      if (next.length > maxHistoryRows) {
        next.pop();
      }
      return next;
    });
  }, [spectrum]);

  // Render waterfall onto HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (history.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font = '9px monospace';
      ctx.fillText('WAITING FOR TELEMETRY SYNC...', width / 2 - 80, height / 2);
      return;
    }

    const rowHeight = height / maxHistoryRows;
    const colWidth = width / history[0].length;

    // Draw the waterfall rows (newer at top, older scrolls down)
    history.forEach((row, rowIndex) => {
      const y = rowIndex * rowHeight;
      row.forEach((col, colIndex) => {
        const x = colIndex * colWidth;
        // Normalize power: base noise ~5, peaks up to 30
        const normalizedVal = (col.power - 3) / 27;
        ctx.fillStyle = getSpectrogramColor(normalizedVal);
        ctx.fillRect(x, y, colWidth + 1, rowHeight + 1); // overlapping slightly prevents thin lines
      });
    });

    // Draw grid overlay lines for harmonic frequencies (7.83, 14.3, 20.8, 27.3, 33.8)
    const harmonics = [7.83, 14.3, 20.8, 27.3, 33.8];
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;

    harmonics.forEach(h => {
      // Find x coordinate relative to frequency range 1.0 to 40.0 Hz
      const xPercent = (h - 1.0) / 39.0;
      const x = xPercent * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Label at bottom
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '6px monospace';
      ctx.fillText(`${h}Hz`, x - 8, height - 4);
    });
    ctx.setLineDash([]); // Reset line dash
  }, [history]);

  return (
    <div className="border border-white/[0.05] rounded bg-black/40 p-2 space-y-1.5 font-mono">
      <div className="flex justify-between items-center text-[7.5px] text-white/40 border-b border-white/[0.04] pb-1">
        <span>WATERFALL SPECTROGRAM</span>
        <span>SCROLL DOWN RATE: 10s</span>
      </div>
      <div className="relative h-28 w-full bg-[#030712] rounded overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={310} 
          height={112} 
          className="w-full h-full block"
        />
      </div>
    </div>
  );
}
