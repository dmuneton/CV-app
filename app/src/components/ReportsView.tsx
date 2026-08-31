import React from 'react';

interface ReportsViewProps {
  onBackToDashboard: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onBackToDashboard }) => {
  return (
    <div id="screen-reports" className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#012d1d] tracking-tight">
            Informes &amp; Rendimiento Botánico
          </h1>
          <p className="text-sm md:text-base text-[#414844] mt-1">
            Análisis financiero consolidado, rendimiento de lotes y costos operativos.
          </p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="bg-white border border-[#c1c8c2] text-[#012d1d] px-4 py-2 rounded-lg font-label-caps text-xs font-semibold hover:bg-[#eef5f7] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Volver al Panel Principal</span>
        </button>
      </div>

      {/* Analytics Summary Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#c1c8c2] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Margen Promedio Global</span>
            <span className="material-symbols-outlined text-[#0e6c4a]">percent</span>
          </div>
          <div className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
            38.4%
          </div>
          <div className="text-xs text-[#0e6c4a] mt-2 flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>+3.2% vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#c1c8c2] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Eficiencia de Insumos</span>
            <span className="material-symbols-outlined text-[#0284c7]">eco</span>
          </div>
          <div className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
            96.8%
          </div>
          <div className="text-xs text-[#414844] mt-2">
            Desperdicio de papel reducido al 3.2%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#c1c8c2] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Retorno de Maquinaria (ROI)</span>
            <span className="material-symbols-outlined text-[#5f2f00]">account_balance</span>
          </div>
          <div className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
            61.0%
          </div>
          <div className="text-xs text-[#414844] mt-2">
            $3,092,500 amortizados de $5.07M total
          </div>
        </div>
      </div>

      {/* Production Batch Status Breakdown */}
      <div className="bg-white rounded-xl border border-[#c1c8c2] p-6 shadow-2xs">
        <h3 className="font-headline text-lg font-bold text-[#012d1d] mb-4">
          Lotes de Producción Activos (45 lotes)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#eef5f7] border border-[#c1c8c2]">
            <div className="font-label-caps text-[11px] text-[#414844]">En Preparación</div>
            <div className="font-headline text-2xl font-bold text-[#012d1d] mt-1 font-numeric-data">
              14 lotes
            </div>
            <p className="text-[11px] text-[#717973] mt-1">Corte y prensado botánico</p>
          </div>
          <div className="p-4 rounded-lg bg-[#c1ecd4]/30 border border-[#a0f4c8]">
            <div className="font-label-caps text-[11px] text-[#005236]">En Encuadernación</div>
            <div className="font-headline text-2xl font-bold text-[#005236] mt-1 font-numeric-data">
              18 lotes
            </div>
            <p className="text-[11px] text-[#0e6c4a] mt-1">Argollado y ensamble</p>
          </div>
          <div className="p-4 rounded-lg bg-[#ffdcc4]/40 border border-[#ffb781]">
            <div className="font-label-caps text-[11px] text-[#5f2f00]">Control de Calidad</div>
            <div className="font-headline text-2xl font-bold text-[#5f2f00] mt-1 font-numeric-data">
              8 lotes
            </div>
            <p className="text-[11px] text-[#5f2f00] mt-1">Inspección de foil y tintas</p>
          </div>
          <div className="p-4 rounded-lg bg-[#f4fafd] border border-[#c1c8c2]">
            <div className="font-label-caps text-[11px] text-[#414844]">Listos para Envío</div>
            <div className="font-headline text-2xl font-bold text-[#012d1d] mt-1 font-numeric-data">
              5 lotes
            </div>
            <p className="text-[11px] text-[#717973] mt-1">Empaque biodegradable</p>
          </div>
        </div>
      </div>
    </div>
  );
};
