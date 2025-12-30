import React from 'react';
import { Stats, Aula } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Clock, BookOpen, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { format, isSameMonth, eachMonthOfInterval, startOfYear, endOfYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  stats: Stats;
  allAulas: Aula[];
  currentDate: Date;
  onNavigateToMonth: (date: Date) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, allAulas, currentDate, onNavigateToMonth }) => {
  const start = startOfYear(currentDate);
  const end = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start, end });

  const chartData = months.map(month => {
    const count = allAulas.filter(a => isSameMonth(new Date(a.data), month)).length;
    return {
      name: format(month, 'MMM', { locale: ptBR }),
      fullName: format(month, 'MMMM', { locale: ptBR }),
      aulas: count,
      date: month
    };
  });

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total de Aulas" 
          value={stats.totalAulas} 
          icon={BookOpen} 
          color="bg-blue-500"
          subtext="No período selecionado"
        />
        <StatCard 
          title="Horas Lecionadas" 
          value={`${stats.totalHoras}h`} 
          icon={Clock} 
          color="bg-purple-500" 
          subtext="Carga horária total"
        />
        <StatCard 
          title="Instrutores Ativos" 
          value={stats.instrutoresAtivos} 
          icon={Users} 
          color="bg-indigo-500"
          subtext="Com aulas agendadas"
        />
        <StatCard 
            title="Conclusão"
            value={`${Math.round((stats.aulasPorStatus.concluida / (stats.totalAulas || 1)) * 100)}%`}
            icon={CheckCircle}
            color="bg-teal-500"
            subtext={`${stats.aulasPorStatus.concluida} concluídas`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Distribuição Anual de Aulas ({format(currentDate, 'yyyy')})</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="aulas" radius={[4, 4, 0, 0]} onClick={(data) => onNavigateToMonth(data.date)}>
                  {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={isSameMonth(entry.date, currentDate) ? '#3b82f6' : '#cbd5e1'} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Status das Aulas</h3>
          <div className="space-y-4">
             {[
                { label: 'Agendada', val: stats.aulasPorStatus.agendada, color: 'bg-blue-500' },
                { label: 'Em Andamento', val: stats.aulasPorStatus['em-andamento'], color: 'bg-yellow-500' },
                { label: 'Concluída', val: stats.aulasPorStatus.concluida, color: 'bg-teal-500' },
                { label: 'Cancelada', val: stats.aulasPorStatus.cancelada, color: 'bg-red-500' },
             ].map((item) => (
                 <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.val}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${item.color}`} 
                            style={{ width: `${(item.val / (stats.totalAulas || 1)) * 100}%` }}
                        ></div>
                    </div>
                 </div>
             ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
             <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle size={20} />
                <div>
                    <span className="font-semibold block">Atenção</span>
                    {stats.aulasPorStatus.cancelada} aulas canceladas neste período.
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
