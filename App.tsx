import React, { useState } from 'react';
import { useSchedule } from './context/ScheduleContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DailyView } from './components/DailyView';
import { MonthlyView } from './components/MonthlyView';
import { RegistrationView } from './components/RegistrationView';
import { ClassModal } from './components/ClassModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginPage } from './components/LoginPage';
import { Aula, ViewMode } from './types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Menu,
  Download,
  Filter,
  Printer,
  CheckCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { format, addDays, subDays, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const App: React.FC = () => {
  const { 
    isAuthenticated,
    viewMode, 
    setViewMode, 
    currentDate, 
    setCurrentDate, 
    filteredAulas,
    stats,
    aulas,
    addAula,
    updateAula,
    deleteAula,
    filters,
    setFilters,
    userProfile,
    notification,
    closeNotification
  } = useSchedule();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<Aula | null>(null);

  // If not authenticated, show Login Page
  if (!isAuthenticated) {
      return <LoginPage />;
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'daily':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case 'monthly':
      case 'dashboard': // Dashboard navigates months for chart context
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
      case 'annual':
        setCurrentDate(direction === 'next' ? addYears(currentDate, 1) : subYears(currentDate, 1));
        break;
      // registrations view navigation doesn't change date usually, but let's keep it safe
    }
  };

  const handleEditAula = (aula: Aula) => {
    setEditingAula(aula);
    setIsModalOpen(true);
  };

  const handleSaveAula = (aulaData: Omit<Aula, 'id'> | Aula) => {
    if ('id' in aulaData) {
      updateAula(aulaData);
    } else {
      addAula(aulaData);
    }
  };

  const handleNewClass = () => {
    setEditingAula(null);
    setIsModalOpen(true);
  };
  
  const handleDateSelection = (date: Date) => {
      setCurrentDate(date);
      setViewMode('daily');
  }

  const getDateLabel = () => {
     if (viewMode === 'annual') return format(currentDate, 'yyyy');
     if (viewMode === 'monthly' || viewMode === 'dashboard') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
     if (viewMode === 'registrations') return 'Gerenciamento';
     return format(currentDate, "dd 'de' MMMM", { locale: ptBR });
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans transition-colors dark:bg-slate-900">
      <Sidebar 
        currentView={viewMode} 
        onChangeView={(view) => {
            setViewMode(view);
            setIsSidebarOpen(false);
        }}
        onNewClass={handleNewClass}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        
        {/* Toast Notification */}
        {notification && (
            <div className="absolute top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
                <div className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
                    ${notification.type === 'success' ? 'bg-white border-green-200 text-green-800 dark:bg-slate-800 dark:border-green-900 dark:text-green-300' : ''}
                    ${notification.type === 'error' ? 'bg-white border-red-200 text-red-800 dark:bg-slate-800 dark:border-red-900 dark:text-red-300' : ''}
                    ${notification.type === 'info' ? 'bg-white border-blue-200 text-blue-800 dark:bg-slate-800 dark:border-blue-900 dark:text-blue-300' : ''}
                `}>
                    {notification.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                    {notification.type === 'error' && <AlertTriangle size={20} className="text-red-500" />}
                    {notification.type === 'info' && <Info size={20} className="text-blue-500" />}
                    
                    <span className="font-medium text-sm">{notification.message}</span>
                    
                    <button onClick={closeNotification} className="ml-2 hover:opacity-70">
                        <X size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 transition-colors dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-slate-700"
            >
                <Menu size={24} />
            </button>
            
            {viewMode !== 'registrations' && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1 dark:bg-slate-700">
                <button 
                    onClick={() => handleNavigate('prev')} 
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all dark:text-gray-300 dark:hover:bg-slate-600"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="w-40 text-center font-semibold text-gray-700 capitalize text-sm sm:text-base dark:text-gray-200">
                    {getDateLabel()}
                </span>
                <button 
                    onClick={() => handleNavigate('next')} 
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all dark:text-gray-300 dark:hover:bg-slate-600"
                >
                    <ChevronRight size={18} />
                </button>
                </div>
            )}
            
            {viewMode !== 'registrations' && (
                <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="hidden sm:block text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-md hover:bg-blue-50 transition dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                >
                    Hoje
                </button>
            )}
          </div>

          <div className="flex items-center gap-3">
             {/* Search Bar */}
             {viewMode !== 'registrations' && (
                 <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all dark:bg-slate-700 dark:focus-within:bg-slate-600 dark:focus-within:border-blue-500">
                    <Search size={18} className="text-gray-400 dark:text-gray-300" />
                    <input 
                        type="text" 
                        placeholder="Buscar aula, instrutor..." 
                        className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400 dark:text-gray-200 dark:placeholder-gray-500"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                 </div>
             )}

             {viewMode !== 'registrations' && (
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden dark:text-gray-300 dark:hover:bg-slate-700">
                    <Search size={20} />
                </button>
             )}
             
             {viewMode === 'daily' && (
                 <button 
                    onClick={handlePrint}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-slate-700"
                    title="Imprimir Diário"
                 >
                    <Printer size={20} />
                 </button>
             )}

             <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hidden sm:block dark:text-gray-300 dark:hover:bg-slate-700">
                <Filter size={20} />
             </button>

             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                {userProfile.avatarInitials}
             </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6 relative dark:bg-slate-900">
          {viewMode === 'daily' && (
            <DailyView 
                currentDate={currentDate} 
                aulas={filteredAulas} 
                onEdit={handleEditAula}
            />
          )}
          {viewMode === 'monthly' && (
            <MonthlyView 
                currentDate={currentDate} 
                aulas={filteredAulas}
                onSelectDate={handleDateSelection}
                onEditAula={handleEditAula}
            />
          )}
          {(viewMode === 'dashboard' || viewMode === 'annual') && (
            <Dashboard 
                stats={stats} 
                allAulas={aulas} 
                currentDate={currentDate}
                onNavigateToMonth={(date) => {
                    setCurrentDate(date);
                    setViewMode('monthly');
                }}
            />
          )}
          {viewMode === 'registrations' && (
              <RegistrationView />
          )}
        </main>
      </div>

      <ClassModal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setEditingAula(null);
        }}
        onSave={handleSaveAula}
        initialData={editingAula}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;