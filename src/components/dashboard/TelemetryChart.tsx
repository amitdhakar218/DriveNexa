import React, { useMemo } from 'react';
import { TelemetryRecord } from '../../types';

interface TelemetryChartProps {
  data: TelemetryRecord[];
  unit: string;
  metricName: string;
  color?: string; // hex
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  unit,
  metricName,
  color = '#06b6d4',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 w-full flex flex-col items-center justify-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center p-4">
        <div className="text-slate-500 text-xs font-medium">
          No Historical Telemetry Recorded
        </div>
        <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
          When the hardware sensor publishes real telemetry to Firebase, real time-series charts and analysis will render here.
        </p>
      </div>
    );
  }

  // Calculate statistics honestly from real records
  const stats = useMemo(() => {
    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    return { max, min, avg, count: values.length };
  }, [data]);

  // SVG coordinate calculations
  const chartHeight = 140;
  const chartWidth = 400;
  const padding = 20;

  const minVal = Math.min(stats.min, 0);
  const maxVal = stats.max === minVal ? stats.max + 10 : stats.max;
  const range = maxVal - minVal || 1;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    const normalizedY = (d.value - minVal) / range;
    const y = chartHeight - padding - normalizedY * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`;

  return (
    <div className="space-y-4">
      {/* Real Statistics Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">MAX</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {stats.max.toFixed(1)} <span className="text-[10px] text-slate-400">{unit}</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">AVG</div>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">
            {stats.avg.toFixed(1)} <span className="text-[10px] text-slate-400">{unit}</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">MIN</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {stats.min.toFixed(1)} <span className="text-[10px] text-slate-400">{unit}</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">DATAPOINTS</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {stats.count}
          </div>
        </div>
      </div>

      {/* Vector Line & Gradient Area Graph */}
      <div className="w-full bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-36 overflow-visible"
        >
          <defs>
            <linearGradient id={`grad-${metricName}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding}
            x2={chartWidth - padding}
            y2={padding}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padding}
            y1={chartHeight / 2}
            x2={chartWidth - padding}
            y2={chartHeight / 2}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#334155"
          />

          {/* Area fill */}
          <polygon points={areaPoints} fill={`url(#grad-${metricName})`} />

          {/* Line path */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Data dot points */}
          {data.map((d, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
            const normalizedY = (d.value - minVal) / range;
            const y = chartHeight - padding - normalizedY * (chartHeight - padding * 2);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3.5"
                fill="#0f172a"
                stroke={color}
                strokeWidth="2"
              />
            );
          })}
        </svg>

        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-2">
          <span>{new Date(data[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>Time Series Telemetry</span>
          <span>{new Date(data[data.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};
