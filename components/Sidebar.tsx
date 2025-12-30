import React from 'react';
import { LayoutDashboard, Calendar, CalendarDays, BarChart3, Plus, Settings, LogOut, Database } from 'lucide-react';
import { ViewMode } from '../types';
import { useSchedule } from '../context/ScheduleContext';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  onNewClass: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onNewClass, onOpenSettings, isOpen }) => {
  const { logout } = useSchedule();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily', label: 'Diário', icon: Calendar },
    { id: 'monthly', label: 'Mensal', icon: CalendarDays },
    { id: 'annual', label: 'Anual', icon: BarChart3 },
    { id: 'registrations', label: 'Cadastros', icon: Database },
  ];

  const handleLogout = () => {
      if (window.confirm("Tem certeza que deseja sair?")) {
          logout();
      }
  };

  return (
    <aside 
        className={`
            fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            dark:bg-slate-800 dark:border-slate-700
        `}
    >
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            CA
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight dark:text-white">CronoAulas</span>
        </div>

        <button 
            onClick={onNewClass}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors shadow-sm mb-6"
        >
            <Plus size={20} />
            <span>Nova Aula</span>
        </button>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewMode)}
                className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                        ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-400' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200'}
                `}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 pt-4 space-y-1 dark:border-slate-700">
             <button 
                onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-gray-200"
             >
                <Settings size={18} />
                Configurações
             </button>
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
             >
                <LogOut size={18} />
                Sair
             </button>
        </div>
      </div>
    </aside>
  );
};