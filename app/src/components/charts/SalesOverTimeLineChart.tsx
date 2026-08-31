import React, { useRef, useState } from 'react';
import { SalesPeriodPoint } from '../../utils/reportsData';

interface SalesOverTimeLineChartProps {
  points: SalesPeriodPoint[];
}

// Verde de marca — para una sola serie no aplica el orden categórico (ese orden
// existe para distinguir varias identidades entre sí), así que se usa el color
// que ya representa "ventas / crecimiento" en el resto del panel.
const LINE_COLOR = '#0e6c4a';
const SURFACE = '#ffffff';

function niceMax(max: number): number {
  if (max <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const residual = max / magnitude;
  let niceResidual: number;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}

export const SalesOverTimeLineChart: React.FC<SalesOverTimeLineChartProps> = ({ points }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  if (points.length === 0) {
    return (
      <p className="text-xs text-[#717973] italic bg-[#f4fafd] p-4 rounded-lg border border-[#c1c8c2]">
        No hay periodos para mostrar todavía.
      </p>
    );
  }

  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 30;
  const pointSpacing = 44;
  const width = Math.max(480, paddingLeft + paddingRight + (points.length - 1) * pointSpacing);

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const rawMax = Math.max(1, ...points.map((p) => p.count));
  const maxVal = niceMax(rawMax);
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((maxVal / tickCount) * i));

  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const xAt = (i: number) => paddingLeft + i * stepX;
  const yAt = (count: number) => paddingTop + plotHeight - (count / maxVal) * plotHeight;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.count)}`).join(' ');
  const areaPath = `${linePath} L ${xAt(points.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`;

  // Muestra máximo ~10 etiquetas en el eje X para que no se amontonen.
  const maxLabels = 10;
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));

  const handlePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const idx = Math.round((x - paddingLeft) / (stepX || 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const lastPoint = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-[11px] text-[#0e6c4a] hover:text-[#012d1d] font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">{showTable ? 'show_chart' : 'table_rows'}</span>
          <span>{showTable ? 'Ver gráfico' : 'Ver como tabla'}</span>
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="bg-[#F0F9F4] font-label-caps text-[10px] text-[#414844]">
                <th className="py-2 px-3">Periodo</th>
                <th className="py-2 px-3 text-right">Órdenes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c1c8c2]/50">
              {points.map((p) => (
                <tr key={p.key}>
                  <td className="py-2 px-3 text-[#161d1f]">{p.label}</td>
                  <td className="py-2 px-3 text-right font-numeric-data text-[#161d1f]">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
            {/* Gridlines + Y ticks */}
            {yTicks.map((t) => (
              <g key={t}>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke="#e1e0d9"
                  strokeWidth={1}
                />
                <text x={paddingLeft - 8} y={yAt(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#898781">
                  {t.toLocaleString()}
                </text>
              </g>
            ))}

            {/* X labels */}
            {points.map((p, i) =>
              i % labelStep === 0 ? (
                <text
                  key={p.key}
                  x={xAt(i)}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#898781"
                >
                  {p.label}
                </text>
              ) : null
            )}

            {/* Area wash */}
            <path d={areaPath} fill={LINE_COLOR} opacity={0.1} stroke="none" />

            {/* Line */}
            <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* End marker + direct label */}
            <circle cx={xAt(points.length - 1)} cy={yAt(lastPoint.count)} r={5} fill={LINE_COLOR} stroke={SURFACE} strokeWidth={2} />
            <text
              x={xAt(points.length - 1)}
              y={yAt(lastPoint.count) - 10}
              textAnchor="end"
              fontSize={11}
              fontWeight={700}
              fill="#012d1d"
            >
              {lastPoint.count}
            </text>

            {/* Crosshair */}
            {hoverIndex !== null && (
              <>
                <line
                  x1={xAt(hoverIndex)}
                  x2={xAt(hoverIndex)}
                  y1={paddingTop}
                  y2={height - paddingBottom}
                  stroke="#c3c2b7"
                  strokeWidth={1}
                />
                <circle
                  cx={xAt(hoverIndex)}
                  cy={yAt(points[hoverIndex].count)}
                  r={5}
                  fill={LINE_COLOR}
                  stroke={SURFACE}
                  strokeWidth={2}
                />
              </>
            )}

            {/* Hit layer for hover/focus */}
            <rect
              x={paddingLeft}
              y={paddingTop}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
              tabIndex={0}
              role="img"
              aria-label="Ventas por periodo — usa el mouse o el teclado para explorar cada punto"
            />
          </svg>

          {/* Tooltip */}
          {hovered && (
            <div
              className="absolute top-2 bg-[#012d1d] text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none whitespace-nowrap"
              style={{
                left: Math.min(
                  Math.max(xAt(hoverIndex!) - 10, paddingLeft),
                  width - paddingRight - 90
                ),
                transform: 'translateX(-50%)'
              }}
            >
              <div className="font-semibold">{hovered.label}</div>
              <div className="font-numeric-data">{hovered.count} {hovered.count === 1 ? 'orden' : 'órdenes'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
