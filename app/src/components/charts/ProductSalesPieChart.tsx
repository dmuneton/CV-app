import React, { useState } from 'react';
import { ProductSalesSlice } from '../../utils/reportsData';

interface ProductSalesPieChartProps {
  data: ProductSalesSlice[];
}

// Paleta categórica validada (orden fijo — ver skill de dataviz): pasa las
// pruebas de CVD y contraste en modo claro para hasta 6 categorías adyacentes.
const SLICE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];
const OTROS_COLOR = '#898781';

const SURFACE = '#ffffff';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArc, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', rInner, rInner, 0, largeArc, 1, startInner.x, startInner.y,
    'Z'
  ].join(' ');
}

export const ProductSalesPieChart: React.FC<ProductSalesPieChartProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const total = data.reduce((acc, s) => acc + s.value, 0);

  if (data.length === 0 || total <= 0) {
    return (
      <p className="text-xs text-[#717973] italic bg-[#f4fafd] p-4 rounded-lg border border-[#c1c8c2]">
        Todavía no hay ventas registradas para graficar por producto.
      </p>
    );
  }

  const cx = 110;
  const cy = 110;
  const rOuter = 100;
  const rInner = 58;

  let cursor = 0;
  const segments = data.map((slice, idx) => {
    const fraction = slice.value / total;
    const startAngle = cursor * 360;
    cursor += fraction;
    // Clamp shy of 360° — a sweep of exactly 360 has identical start/end points,
    // which SVG's arc command can't render (happens whenever one slice is ~100%,
    // e.g. only one product has sales so far).
    const endAngle = Math.min(cursor * 360, startAngle + 359.99);
    const color = slice.name === 'Otros' ? OTROS_COLOR : SLICE_COLORS[idx % SLICE_COLORS.length];
    return { ...slice, startAngle, endAngle, fraction, color, idx };
  });

  const active = activeIndex !== null ? segments[activeIndex] : null;

  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-[11px] text-[#0e6c4a] hover:text-[#012d1d] font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">
            {showTable ? 'donut_large' : 'table_rows'}
          </span>
          <span>{showTable ? 'Ver gráfico' : 'Ver como tabla'}</span>
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F0F9F4] font-label-caps text-[10px] text-[#414844]">
                <th className="py-2 px-3">Producto</th>
                <th className="py-2 px-3 text-right">Ventas</th>
                <th className="py-2 px-3 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c1c8c2]/50">
              {segments.map((s) => (
                <tr key={s.name}>
                  <td className="py-2 px-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[#161d1f]">{s.name}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-numeric-data text-[#161d1f]">
                    ${s.value.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-numeric-data text-[#717973]">
                    {(s.fraction * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut */}
          <div className="relative shrink-0">
            <svg width={220} height={220} viewBox="0 0 220 220">
              {segments.map((s) => (
                <path
                  key={s.name}
                  d={describeDonutSegment(cx, cy, rOuter, rInner, s.startAngle, s.endAngle)}
                  fill={s.color}
                  stroke={SURFACE}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  opacity={activeIndex === null || activeIndex === s.idx ? 1 : 0.45}
                  tabIndex={0}
                  role="img"
                  aria-label={`${s.name}: $${s.value.toLocaleString()}, ${(s.fraction * 100).toFixed(1)}%`}
                  onMouseEnter={() => setActiveIndex(s.idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(s.idx)}
                  onBlur={() => setActiveIndex(null)}
                  className="cursor-pointer transition-opacity outline-none"
                />
              ))}
            </svg>
            {/* Center readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
              {active ? (
                <>
                  <span className="text-[10px] font-label-caps text-[#717973] truncate max-w-[110px]">
                    {active.name}
                  </span>
                  <span className="font-numeric-data text-lg font-bold text-[#012d1d]">
                    ${active.value.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#717973]">{(active.fraction * 100).toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-label-caps text-[#717973]">Total Ventas</span>
                  <span className="font-numeric-data text-lg font-bold text-[#012d1d]">
                    ${total.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full space-y-1.5">
            {segments.map((s) => (
              <div
                key={s.name}
                onMouseEnter={() => setActiveIndex(s.idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg cursor-default transition-colors ${
                  activeIndex === s.idx ? 'bg-[#f4fafd]' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-[#161d1f] truncate">{s.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-numeric-data text-xs font-semibold text-[#012d1d]">
                    ${s.value.toLocaleString()}
                  </span>
                  <span className="font-numeric-data text-[10px] text-[#717973] w-10 text-right">
                    {(s.fraction * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
