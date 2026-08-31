import React from 'react';
import { ScreenType } from '../types';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard' as ScreenType, label: 'Panel de Control', icon: 'dashboard' },
    { id: 'inventory' as ScreenType, label: 'Inventario', icon: 'inventory_2' },
    { id: 'product-engineering' as ScreenType, label: 'Órdenes', icon: 'receipt_long' },
    { id: 'sales-crm' as ScreenType, label: 'CRM Clientes', icon: 'person_add' },
    { id: 'reports' as ScreenType, label: 'Informes', icon: 'assessment' },
  ];

  const handleNavClick = (e: React.MouseEvent, screen: ScreenType) => {
    e.preventDefault();
    onNavigate(screen);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        id="main-sidebar"
        className={`fixed left-0 top-0 h-screen w-64 bg-[#f4fafd] border-r border-[#c1c8c2] z-50 flex flex-col py-6 px-4 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c1ecd4] flex items-center justify-center text-[#012d1d] shadow-sm">
            <span className="material-symbols-outlined fill-1 text-2xl">eco</span>
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg text-[#012d1d] leading-tight tracking-tight">
              Creatividad Verde
            </h1>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-grow" aria-label="Navegación Principal">
          {navItems.map((item) => {
            const isActive =
              currentScreen === item.id ||
              (item.id === 'inventory' && currentScreen === 'fixed-assets');

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                id={`nav-${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'text-[#005236] bg-[#a0f4c8] font-semibold shadow-xs scale-[0.98]'
                    : 'text-[#414844] hover:bg-[#e2e9ec] hover:text-[#012d1d] font-normal'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${
                    isActive ? 'fill-1 text-[#005236]' : 'text-[#414844] group-hover:text-[#012d1d]'
                  }`}
                  data-icon={item.icon}
                >
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="mt-auto pt-4 border-t border-[#c1c8c2] flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1b4332] text-[#c1ecd4] flex items-center justify-center font-bold text-xs border border-[#c1c8c2] shadow-xs">
              AD
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-label-caps text-[11px] text-[#161d1f] font-semibold truncate">
                Administrador
              </span>
            </div>
          </div>
          <button
            id="sidebar-quick-settings-btn"
            onClick={() => onNavigate('reports')}
            title="Configuración e Informes"
            className="text-[#717973] hover:text-[#012d1d] p-1 rounded-md hover:bg-[#e2e9ec] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
