import React from 'react';
import { Aula } from '../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyViewProps {
  currentDate: Date;
  aulas: Aula[];
  onSelectDate: (date: Date) => void;
  onEditAula: (aula: Aula) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ currentDate, aulas, onSelectDate, onEditAula }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, dayIdx) => {
            const dayAulas = aulas.filter(a => isSameDay(new Date(a.data), day));
            // Sort by time
            dayAulas.sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toString()}
                onClick={() => onSelectDate(day)}
                className={`
                min-h-[120px] p-2 border-b border-r border-gray-100 relative group cursor-pointer transition-colors
                ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'}
                ${isDayToday ? 'bg-blue-50/30' : 'hover:bg-gray-50'}
              `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${isDayToday ? 'bg-blue-600 text-white' : 'text-gray-700'}
                `}>
                    {format(day, 'd')}
                  </span>
                  {dayAulas.length > 0 && (
                    <span className="text-xs text-gray-400 font-medium">{dayAulas.length}</span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                  {dayAulas.slice(0, 4).map((aula) => (
                    <div
                      key={aula.id}
                      onClick={(e) => { e.stopPropagation(); onEditAula(aula); }}
                      className="text-[9px] px-1.5 py-1 rounded border-l-2 hover:opacity-80 transition flex flex-col leading-tight"
                      style={{
                        backgroundColor: `${aula.cor}15`,
                        color: '#334155',
                        borderLeftColor: aula.cor
                      }}
                      title={`Curso: ${aula.curso}\nMatéria: ${aula.materia}\nHorário: ${aula.horarioInicio} - ${aula.horarioFim}`}
                    >
                      <div className="font-bold truncate uppercase">{aula.curso}</div>
                      <div className="opacity-80 truncate">{aula.materia} • {aula.horarioInicio}</div>
                    </div>
                  ))}
                  {dayAulas.length > 4 && (
                    <div className="text-[10px] text-gray-400 text-center pt-1">
                      + {dayAulas.length - 4} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
