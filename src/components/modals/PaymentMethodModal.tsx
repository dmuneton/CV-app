import React, { useState } from 'react';
import { OrderItem } from '../../types';

export type PaymentActionMode = 'Abono' | 'Pagado';

interface PaymentMethodModalProps {
  isOpen: boolean;
  order: OrderItem | null;
  mode: PaymentActionMode | null;
  onCancel: () => void;
  onConfirm: (method: 'Efectivo' | 'Banco', amount: number) => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  order,
  mode,
  onCancel,
  onConfirm,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'Efectivo' | 'Banco'>('Efectivo');
  const [abonoAmount, setAbonoAmount] = useState<number>(0);

  const amountDue = order ? Math.max(0, order.value - (order.amountPaid || 0)) : 0;

  React.useEffect(() => {
    if (isOpen) {
      setSelectedMethod('Efectivo');
      setAbonoAmount(amountDue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order?.id, mode]);

  if (!isOpen || !order || !mode) return null;

  const isAbono = mode === 'Abono';
  const amountToRegister = isAbono ? Math.min(Math.max(0, abonoAmount), amountDue) : amountDue;
  const remainingAfter = Math.max(0, amountDue - amountToRegister);

  const handleConfirm = () => {
    if (amountToRegister <= 0) return;
    onConfirm(selectedMethod, amountToRegister);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0e6c4a] flex items-center justify-center text-white shrink-0 shadow-inner">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold tracking-tight">
              {isAbono ? 'Registrar Abono' : 'Registrar Pago Completo'}
            </h3>
            <p className="text-xs text-[#a0f4c8] mt-0.5">
              Orden {order.orderId} · Saldo pendiente: ${amountDue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {isAbono ? (
            <>
              <p className="text-[#414844] leading-relaxed">
                ¿Cuánto abonó el cliente y a dónde llegó el pago? Calcularemos el saldo restante automáticamente.
              </p>
              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Monto Abonado ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max={amountDue}
                  step="1000"
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm font-numeric-data font-bold text-[#012d1d] focus:outline-none focus:border-[#0e6c4a]"
                />
              </div>
              <div className="bg-[#f0f9f4] border border-[#a0f4c8] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#0e6c4a] font-semibold uppercase tracking-wider">
                  Saldo Restante
                </span>
                <span className="font-numeric-data text-sm font-bold text-[#012d1d]">
                  ${remainingAfter.toLocaleString()}
                </span>
              </div>
              {remainingAfter === 0 && (
                <p className="text-[11px] text-[#0e6c4a] font-semibold">
                  ✓ Este abono cubre el total — la orden quedará marcada como "Pagado".
                </p>
              )}
            </>
          ) : (
            <p className="text-[#414844] leading-relaxed">
              Vas a registrar el pago del saldo restante:{' '}
              <strong className="text-[#012d1d]">${amountDue.toLocaleString()}</strong>. El valor se sumará
              al Panel de Control y la orden pasará automáticamente a estado{' '}
              <strong className="text-[#012d1d]">Enviado</strong>.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod('Efectivo')}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'Efectivo'
                  ? 'border-[#0e6c4a] bg-[#f0f9f4] text-[#012d1d]'
                  : 'border-[#c1c8c2] hover:border-[#0e6c4a]/50 text-[#414844]'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">payments</span>
              <span className="font-semibold text-sm">Efectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('Banco')}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedMethod === 'Banco'
                  ? 'border-[#0e6c4a] bg-[#f0f9f4] text-[#012d1d]'
                  : 'border-[#c1c8c2] hover:border-[#0e6c4a]/50 text-[#414844]'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">account_balance</span>
              <span className="font-semibold text-sm">Banco</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8faf9] border-t border-[#c1c8c2] flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={amountToRegister <= 0}
            className="px-5 py-2.5 bg-[#012d1d] hover:bg-[#0e6c4a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{isAbono ? 'Confirmar Abono' : 'Confirmar Pago'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
