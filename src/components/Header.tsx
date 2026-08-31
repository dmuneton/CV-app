import React from 'react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onNewOrder: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  notificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onNewOrder,
  searchTerm,
  onSearchChange,
  notificationsCount = 3,
  onOpenNotifications,
  onOpenSettings
}) => {
  return (
    <header
      id="top-header"
      className="sticky top-0 z-40 w-full h-16 bg-[#f4fafd]/90 backdrop-blur-md border-b border-[#c1c8c2] px-4 md:px-10 flex items-center justify-between transition-all"
    >
      {/* Left: Mobile trigger & Global Operations Search */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-trigger"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#012d1d] hover:bg-[#e2e9ec] transition-colors"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Global Operations Search */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#717973] text-[18px] pointer-events-none">
            search
          </span>
          <input
            id="global-operations-search"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar operaciones, clientes, insumos..."
            className="pl-9 pr-8 py-2 bg-white border border-[#c1c8c2] rounded-lg text-sm text-[#161d1f] placeholder:text-[#717973] focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] w-56 sm:w-72 md:w-96 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-[#717973] hover:text-[#161d1f]"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[#414844]">
          <button
            id="btn-notifications-top"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg hover:text-[#012d1d] hover:bg-[#e2e9ec] transition-colors cursor-pointer"
            title="Notificaciones de alertas"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]" />
            )}
          </button>
          <button
            id="btn-quick-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:text-[#012d1d] hover:bg-[#e2e9ec] transition-colors cursor-pointer"
            title="Informes y Ajustes"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>

        <button
          id="btn-new-order-top"
          onClick={onNewOrder}
          className="bg-[#012d1d] text-white hover:bg-[#1b4332] font-label-caps text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Nueva Orden</span>
        </button>
      </div>
    </header>
  );
};
