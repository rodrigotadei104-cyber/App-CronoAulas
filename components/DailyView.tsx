import React, { useMemo } from 'react';
import { Aula } from '../types';
import { format, isSameDay, parse, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, User, Clock, AlertCircle } from 'lucide-react';

interface DailyViewProps {
  currentDate: Date;
  aulas: Aula[];
  onEdit: (aula: Aula) => void;
}

const START_HOUR = 5; // Start timeline at 05:00
const HOURS = Array.from({ length: 24 - START_HOUR }, (_, i) => i + START_HOUR);

interface ProcessedClass extends Aula {
  startMinutes: number;
  endMinutes: number;
  duration: number;
  colIndex?: number;
  leftPercent?: number;
  widthPercent?: number;
}

export const DailyView: React.FC<DailyViewProps> = ({ currentDate, aulas, onEdit }) => {
  // 1. Calculate layout for overlapping events
  const processedClasses = useMemo(() => {
    const getMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    // Filter for today and sort by start time, then duration (desc)
    const dayClasses: ProcessedClass[] = aulas
      .filter((a) => isSameDay(new Date(a.data), currentDate))
      .map(a => ({
          ...a,
          startMinutes: getMinutes(a.horarioInicio),
          endMinutes: getMinutes(a.horarioFim),
          duration: differenceInMinutes(parse(a.horarioFim, 'HH:mm', new Date()), parse(a.horarioInicio, 'HH:mm', new Date()))
      }))
      .sort((a, b) => {
          if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
          return b.duration - a.duration;
      });

    // Cluster detection for overlaps
    const clusters: ProcessedClass[][] = [];
    let currentCluster: ProcessedClass[] = [];
    let clusterEnd = -1;

    dayClasses.forEach(event => {
        if (currentCluster.length === 0) {
            currentCluster.push(event);
            clusterEnd = event.endMinutes;
        } else {
            // Overlap check: if event starts before cluster ends
            if (event.startMinutes < clusterEnd) {
                currentCluster.push(event);
                clusterEnd = Math.max(clusterEnd, event.endMinutes);
            } else {
                clusters.push(currentCluster);
                currentCluster = [event];
                clusterEnd = event.endMinutes;
            }
        }
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);

    // Assign columns within clusters
    const finalEvents: ProcessedClass[] = [];
    
    clusters.forEach(cluster => {
        const columns: ProcessedClass[][] = [];
        cluster.forEach(event => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const lastInCol = columns[i][columns[i].length - 1];
                if (event.startMinutes >= lastInCol.endMinutes) {
                    columns[i].push(event);
                    event.colIndex = i;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([event]);
                event.colIndex = columns.length - 1;
            }
        });

        const totalCols = columns.length;
        cluster.forEach(event => {
            const colIndex = event.colIndex || 0;
            finalEvents.push({
                ...event,
                leftPercent: (colIndex / totalCols) * 100,
                widthPercent: 100 / totalCols
            });
        });
    });

    return finalEvents;
  }, [aulas, currentDate]);

  // Helper to calculate current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    return hours;
  };

  const currentHours = getCurrentTimePosition();
  const showTimeIndicator = isSameDay(new Date(), currentDate) && currentHours >= START_HOUR;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:overflow-visible print:border-0 print:shadow-none print:h-auto">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-20 print:static print:bg-white print:border-b-2 print:mb-4">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
                {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
            <div className="text-sm text-gray-500">
                {processedClasses.length} aulas agendadas
            </div>
        </div>
      
      {/* Added pt-5 (padding-top: 1.25rem) to prevent 05:00 label cutoff */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar print:overflow-visible print:h-auto pt-5 pb-5">
        <div 
            className="relative"
            style={{ minHeight: `${HOURS.length * 5}rem` }}
        >
          
          {/* Grid Lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-t border-gray-100 flex print:border-gray-200"
              style={{ top: `${(hour - START_HOUR) * 5}rem`, height: '5rem' }}
            >
              <div className="w-16 flex-shrink-0 text-xs text-gray-400 text-right pr-4 -mt-2.5 select-none print:text-gray-600">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-grow relative"></div>
            </div>
          ))}

          {/* Current Time Indicator (Hide on print) */}
          {showTimeIndicator && (
            <div 
                className="absolute w-full border-t border-red-500/60 z-[5] pointer-events-none flex items-center print:hidden"
                style={{ top: `${(currentHours - START_HOUR) * 5}rem` }}
            >
                <div className="w-2 h-2 bg-red-500 rounded-full absolute left-[3.5rem] -translate-y-1/2 shadow-sm"></div>
            </div>
          )}

          {/* Classes */}
          {processedClasses.map((aula) => {
            const startHours = aula.startMinutes / 60;
            const durationHours = aula.duration / 60;
            
            // Adjust position based on START_HOUR offset
            const top = `${(startHours - START_HOUR) * 5}rem`;
            const height = `${durationHours * 5}rem`;
            
            // Do not render if it ends before start hour
            if (startHours + durationHours < START_HOUR) return null;

            // Styles for short events
            const isShort = aula.duration <= 45;
            const isVeryShort = aula.duration <= 30;

            const leftPercent = aula.leftPercent || 0;
            const widthPercent = aula.widthPercent || 100;

            return (
              <div
                key={aula.id}
                onClick={() => onEdit(aula)}
                className={`
                    absolute border-l-4 cursor-pointer hover:shadow-md hover:brightness-95 transition-all z-10 group overflow-hidden print:shadow-none print:border-l-[4px]
                    ${isVeryShort ? 'p-1 px-2 flex items-center gap-2' : 'p-2'}
                `}
                style={{
                  top,
                  height,
                  left: `calc(4rem + ${leftPercent}% - ${(leftPercent / 100) * 1}rem)`, 
                  width: `calc(${widthPercent}% - 1rem)`,
                  backgroundColor: `${aula.cor}15`, 
                  borderColor: aula.cor,
                  background: `linear-gradient(0deg, ${aula.cor}15, ${aula.cor}15), rgba(255,255,255,0.9)`
                }}
              >
                <div className={`flex justify-between items-start ${isVeryShort ? 'w-full' : ''}`}>
                    <div className="font-semibold text-xs sm:text-sm text-gray-800 line-clamp-1 truncate print:text-black">
                        {aula.materia}
                    </div>
                    {aula.status === 'cancelada' && !isVeryShort && <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
                </div>
                
                {!isShort && (
                    <>
                        <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 flex items-center gap-1 truncate print:text-gray-700">
                            <Clock size={10} className="flex-shrink-0" />
                            {aula.horarioInicio} - {aula.horarioFim}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate print:text-gray-600">
                            <MapPin size={10} className="flex-shrink-0" />
                            {aula.sala || 'N/A'}
                            <span className="mx-0.5">•</span>
                            <User size={10} className="flex-shrink-0" />
                            {aula.instrutor}
                        </div>
                    </>
                )}
                
                {isShort && !isVeryShort && (
                     <div className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1 print:text-gray-700">
                        {aula.horarioInicio} - {aula.sala}
                    </div>
                )}
                
                {isVeryShort && (
                     <div className="text-[10px] text-gray-500 ml-auto whitespace-nowrap print:text-gray-600">
                        {aula.horarioInicio}
                    </div>
                )}

                {/* Hide 'Agora' badge on print */}
                {aula.status === 'em-andamento' && !isVeryShort && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] rounded-full font-medium print:hidden">
                        Agora
                    </div>
                )}
              </div>
            );
          })}
          
          {processedClasses.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                  <div className="text-center">
                      <p className="text-gray-400 text-lg">Nenhuma aula para este dia</p>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};