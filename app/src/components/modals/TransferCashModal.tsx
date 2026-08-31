import React, { useState } from 'react';

type CashAccount = 'efectivo' | 'banco';

interface TransferCashModalProps {
  isOpen: boolean;
  cashBalance: { efectivo: number; banco: number };
  onClose: () => void;
  onConfirm: (from: CashAccount, to: CashAccount, amount: number) => void;
}

const ACCOUNT_LABEL: Record<CashAccount, string> = {
  efectivo: 'Efectivo',
  banco: 'Banco'
};

const ACCOUNT_ICON: Record<CashAccount, string> = {
  efectivo: 'payments',
  banco: 'account_balance'
};

export const TransferCashModal: React.FC<TransferCashModalProps> = ({
  isOpen,
  cashBalance,
  onClose,
  onConfirm
}) => {
  const [from, setFrom] = useState<CashAccount>('efectivo');
  const [amount, setAmount] = useState<number>(0);

  const to: CashAccount = from === 'efectivo' ? 'banco' : 'efectivo';
  const sourceBalance = cashBalance[from];
  const safeAmount = Math.min(Math.max(0, amount), sourceBalance);

  React.useEffect(() => {
    if (isOpen) {
      setFrom('efectivo');
      setAmount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwap = () => {
    setFrom(to);
  };

  const handleConfirm = () => {
    if (safeAmount <= 0) return;
    onConfirm(from, to, safeAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0e6c4a] flex items-center justify-center text-white shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-2xl">swap_horiz</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold tracking-tight">Pasar Dinero</h3>
            <p className="text-xs text-[#a0f4c8] mt-0.5">Mueve un monto entre Efectivo y Banco</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Origen / Destino */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 border-[#0e6c4a] bg-[#f0f9f4] text-[#012d1d]">
              <span className="font-label-caps text-[9px] text-[#0e6c4a] font-semibold uppercase tracking-wider">
                Desde
              </span>
              <span className="material-symbols-outlined text-2xl">{ACCOUNT_ICON[from]}</span>
              <span className="font-semibold text-sm">{ACCOUNT_LABEL[from]}</span>
              <span className="font-numeric-data text-[11px] text-[#414844]">
                ${sourceBalance.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              title="Invertir origen y destino"
              className="shrink-0 w-8 h-8 rounded-full border border-[#c1c8c2] bg-white hover:bg-[#eef5f7] flex items-center justify-center text-[#414844] hover:text-[#012d1d] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            </button>

            <div className="flex-1 flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 border-[#c1c8c2] text-[#414844]">
              <span className="font-label-caps text-[9px] text-[#717973] font-semibold uppercase tracking-wider">
                Hacia
              </span>
              <span className="material-symbols-outlined text-2xl">{ACCOUNT_ICON[to]}</span>
              <span className="font-semibold text-sm">{ACCOUNT_LABEL[to]}</span>
              <span className="font-numeric-data text-[11px] text-[#717973]">
                ${cashBalance[to].toLocaleString()}
              </span>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
              Monto a Pasar ($)
            </label>
            <input
              type="number"
              min="0"
              max={sourceBalance}
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm font-numeric-data font-bold text-[#012d1d] focus:outline-none focus:border-[#0e6c4a]"
            />
            {amount > sourceBalance && (
              <p className="text-[10px] text-[#ba1a1a] mt-1">
                No hay suficiente saldo en {ACCOUNT_LABEL[from]} — se ajustará al máximo disponible (${sourceBalance.toLocaleString()}).
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#414844]">{ACCOUNT_LABEL[from]} quedará en:</span>
              <span className="font-numeric-data font-bold text-[#012d1d]">
                ${(sourceBalance - safeAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#414844]">{ACCOUNT_LABEL[to]} quedará en:</span>
              <span className="font-numeric-data font-bold text-[#012d1d]">
                ${(cashBalance[to] + safeAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8faf9] border-t border-[#c1c8c2] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={safeAmount <= 0}
            className="px-5 py-2.5 bg-[#012d1d] hover:bg-[#0e6c4a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Confirmar Traslado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
