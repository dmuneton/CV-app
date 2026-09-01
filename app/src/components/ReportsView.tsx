import React, { useState } from 'react';
import { OrderItem, ClientProfile, FixedAsset, InventoryItem } from '../types';
import { getClientOrders, getTotalSalesAcrossClients } from '../utils/clientPurchases';
import {
  getProductSales,
  capSlices,
  getSalesOverTime,
  SalesGranularity,
  SalesScope,
  REPORTS_START_YEAR,
  MONTH_NAMES
} from '../utils/reportsData';
import { ProductSalesPieChart } from './charts/ProductSalesPieChart';
import { SalesOverTimeLineChart } from './charts/SalesOverTimeLineChart';

interface ReportsViewProps {
  orders: OrderItem[];
  clients: ClientProfile[];
  fixedAssets: FixedAsset[];
  inventory: InventoryItem[];
  cashBalance: { efectivo: number; banco: number };
  netProfit: number;
  onBackToDashboard: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  clients,
  fixedAssets,
  inventory,
  cashBalance,
  netProfit,
  onBackToDashboard
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [granularity, setGranularity] = useState<SalesGranularity>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(currentMonth / 3));
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [yearMode, setYearMode] = useState<'all' | 'single'>('all');

  const yearOptions = Array.from(
    { length: currentYear - REPORTS_START_YEAR + 1 },
    (_, i) => currentYear - i
  );

  // Nunca dejar seleccionado un mes/trimestre futuro cuando el año elegido es el actual.
  const isSelectedYearCurrent = selectedYear === currentYear;
  const maxMonth = isSelectedYearCurrent ? currentMonth : 11;
  const maxQuarter = isSelectedYearCurrent ? Math.floor(currentMonth / 3) : 3;
  const effectiveMonth = Math.min(selectedMonth, maxMonth);
  const effectiveQuarter = Math.min(selectedQuarter, maxQuarter);

  const scope: SalesScope =
    granularity === 'month'
      ? { granularity: 'month', month: effectiveMonth, year: selectedYear }
      : granularity === 'quarter'
      ? { granularity: 'quarter', quarter: effectiveQuarter, year: selectedYear }
      : yearMode === 'all'
      ? { granularity: 'year', mode: 'all' }
      : { granularity: 'year', mode: 'single', year: selectedYear };

  const productSales = capSlices(getProductSales(orders), 6);
  const salesOverTime = getSalesOverTime(orders, scope);

  // Ventas: órdenes de cliente (no compras de insumos) que ya llegaron a Terminado o Enviado.
  const ventasCount = orders.filter(
    (o) => !o.isExpense && (o.status === 'Terminado' || o.status === 'Enviado')
  ).length;

  // Recompra: de las órdenes de cada cliente (mismo emparejamiento que usa CRM Clientes),
  // todas menos la primera (la más antigua) son una recompra — se cuentan las que además
  // ya están pagadas.
  const recompraCount = clients.reduce((count, client) => {
    const clientOrders = getClientOrders(client, orders).filter((o) => !o.isExpense);
    if (clientOrders.length <= 1) return count;
    const repeatOrders = clientOrders.slice(0, clientOrders.length - 1);
    return count + repeatOrders.filter((o) => o.paymentStatus === 'Pagado').length;
  }, 0);

  const totalSales = getTotalSalesAcrossClients(clients, orders);

  const totalAssetInvestment = fixedAssets.reduce((acc, a) => acc + a.initialCost, 0);
  const totalInventoryInvestment = inventory.reduce((acc, i) => acc + i.unitCost * i.stock, 0);

  return (
    <div id="screen-reports" className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#012d1d] tracking-tight">
            Informes
          </h1>
        </div>
        <button
          onClick={onBackToDashboard}
          className="bg-white border border-[#c1c8c2] text-[#012d1d] px-4 py-2 rounded-lg font-label-caps text-xs font-semibold hover:bg-[#eef5f7] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Volver al Panel Principal</span>
        </button>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Ventas */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-xs text-[#414844]">Ventas</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
              {ventasCount}
            </span>
            <span className="text-sm font-medium text-[#414844]">{ventasCount === 1 ? 'orden' : 'órdenes'}</span>
          </div>
          <p className="text-[10px] text-[#717973] mt-2 border-t border-[#c1c8c2] pt-2.5">
            Órdenes en estado Terminado o Enviado
          </p>
        </div>

        {/* Recompra */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-xs text-[#414844]">Recompra</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">autorenew</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
              {recompraCount}
            </span>
            <span className="text-sm font-medium text-[#414844]">{recompraCount === 1 ? 'orden' : 'órdenes'}</span>
          </div>
          <p className="text-[10px] text-[#717973] mt-2 border-t border-[#c1c8c2] pt-2.5">
            Órdenes de recompra ya pagadas
          </p>
        </div>

        {/* Ventas Totales */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-xs text-[#414844]">Ventas Totales</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-bold text-[#012d1d] text-right font-numeric-data">
            ${totalSales.toLocaleString()}
          </div>
        </div>

        {/* Saldo en Caja */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Saldo en Caja</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-bold text-[#012d1d] text-right font-numeric-data mb-2">
            ${(cashBalance.efectivo + cashBalance.banco).toLocaleString()}
          </div>
          <div className="flex justify-between font-numeric-data text-xs text-[#414844] border-t border-[#c1c8c2] pt-2.5 mt-auto">
            <span>Efectivo: ${cashBalance.efectivo.toLocaleString()}</span>
            <span>Banco: ${cashBalance.banco.toLocaleString()}</span>
          </div>
        </div>

        {/* Ganancias Netas */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Ganancias Netas</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-bold text-[#012d1d] text-right font-numeric-data">
            ${netProfit.toLocaleString()}
          </div>
        </div>

        {/* Activos Fijos */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Activos Fijos</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
              {fixedAssets.length}
            </span>
            <span className="text-sm font-medium text-[#414844]">
              {fixedAssets.length === 1 ? 'activo' : 'activos'}
            </span>
          </div>
          <p className="text-xs text-[#414844] mt-2 border-t border-[#c1c8c2] pt-2.5 text-right font-numeric-data">
            Inversión total: ${totalAssetInvestment.toLocaleString()}
          </p>
        </div>

        {/* Insumos en Inventario */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Insumos en Inventario</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
              {inventory.length}
            </span>
            <span className="text-sm font-medium text-[#414844]">{inventory.length === 1 ? 'insumo' : 'insumos'}</span>
          </div>
          <p className="text-xs text-[#414844] mt-2 border-t border-[#c1c8c2] pt-2.5 text-right font-numeric-data">
            Inversión total: ${totalInventoryInvestment.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Número de Clientes */}
        <div className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-xs text-[#414844]">Clientes</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="font-headline text-3xl font-bold text-[#012d1d] font-numeric-data">
              {clients.length}
            </span>
            <span className="text-sm font-medium text-[#414844]">{clients.length === 1 ? 'cliente' : 'clientes'}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Ventas por Producto */}
        <div className="bg-white border border-[#c1c8c2] rounded-xl p-5 shadow-2xs">
          <h3 className="font-headline text-lg font-bold text-[#012d1d] mb-1">Ventas por Producto</h3>
          <p className="text-xs text-[#717973] mb-4">
            Distribución de ventas según los productos registrados en Órdenes.
          </p>
          <ProductSalesPieChart data={productSales} />
        </div>

        {/* Ventas en el Tiempo */}
        <div className="bg-white border border-[#c1c8c2] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-headline text-lg font-bold text-[#012d1d]">Ventas en el Tiempo</h3>
            {/* Filtros — una sola fila, encima del gráfico */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#eef5f7] p-0.5 rounded-lg border border-[#c1c8c2]">
                {(
                  [
                    { value: 'month', label: 'Mes' },
                    { value: 'quarter', label: 'Trimestre' },
                    { value: 'year', label: 'Año' }
                  ] as { value: SalesGranularity; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGranularity(opt.value)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      granularity === opt.value
                        ? 'bg-white text-[#012d1d] shadow-2xs'
                        : 'text-[#414844] hover:text-[#012d1d]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Mes: elegir mes + año */}
              {granularity === 'month' && (
                <>
                  <select
                    value={effectiveMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-[#f4fafd] border border-[#c1c8c2] text-[#161d1f] text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx} disabled={isSelectedYearCurrent && idx > currentMonth}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-[#f4fafd] border border-[#c1c8c2] text-[#161d1f] text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </>
              )}

              {/* Trimestre: elegir trimestre + año */}
              {granularity === 'quarter' && (
                <>
                  <select
                    value={effectiveQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    className="bg-[#f4fafd] border border-[#c1c8c2] text-[#161d1f] text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                  >
                    {[0, 1, 2, 3].map((q) => (
                      <option key={q} value={q} disabled={isSelectedYearCurrent && q > maxQuarter}>
                        Trimestre {q + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-[#f4fafd] border border-[#c1c8c2] text-[#161d1f] text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </>
              )}

              {/* Año: todo el histórico, o un año en particular */}
              {granularity === 'year' && (
                <>
                  <div className="flex items-center bg-[#eef5f7] p-0.5 rounded-lg border border-[#c1c8c2]">
                    <button
                      type="button"
                      onClick={() => setYearMode('all')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        yearMode === 'all' ? 'bg-white text-[#012d1d] shadow-2xs' : 'text-[#414844] hover:text-[#012d1d]'
                      }`}
                    >
                      Todo
                    </button>
                    <button
                      type="button"
                      onClick={() => setYearMode('single')}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        yearMode === 'single' ? 'bg-white text-[#012d1d] shadow-2xs' : 'text-[#414844] hover:text-[#012d1d]'
                      }`}
                    >
                      Un año
                    </button>
                  </div>
                  {yearMode === 'single' && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-[#f4fafd] border border-[#c1c8c2] text-[#161d1f] text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-[#717973] mb-4">
            {granularity === 'month' && `Órdenes por día — ${MONTH_NAMES[effectiveMonth]} ${selectedYear}.`}
            {granularity === 'quarter' && `Órdenes por mes — Trimestre ${effectiveQuarter + 1} de ${selectedYear}.`}
            {granularity === 'year' &&
              (yearMode === 'all'
                ? `Órdenes por año, desde ${REPORTS_START_YEAR}.`
                : `Órdenes por mes — ${selectedYear}.`)}
          </p>
          <SalesOverTimeLineChart points={salesOverTime} />
        </div>
      </div>
    </div>
  );
};
