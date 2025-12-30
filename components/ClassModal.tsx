import React, { useState, useEffect, useMemo } from 'react';
import { Aula } from '../types';
import { X, Trash2, Loader2, AlertTriangle, Check, XCircle } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { addMinutes, format } from 'date-fns';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aula: Omit<Aula, 'id'> | Aula) => void;
  initialData?: Aula | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { instrutores, cursos, materias, appSettings, deleteAula, showNotification } = useSchedule();

  const [formData, setFormData] = useState<Partial<Aula>>({
    data: new Date(),
    horarioInicio: '08:00',
    horarioFim: '10:00',
    instrutor: '',
    curso: '',
    materia: '',
    sala: '',
    status: 'agendada',
    cor: '#3b82f6',
    observacoes: '',
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter materias based on selected course
  const filteredMaterias = useMemo(() => {
    if (!formData.curso) return [];
    // Find course ID by name
    const selectedCursoObj = cursos.find(c => c.nome === formData.curso);
    if (!selectedCursoObj) return [];

    return materias.filter(m => m.cursoId === selectedCursoObj.id);
  }, [formData.curso, cursos, materias]);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setShowDeleteConfirm(false); // Reset UI state on open
      if (initialData) {
        setFormData(initialData);
      } else {
        // Reset for new entry
        const defaultCurso = cursos[0];

        // Calculate end time based on settings
        const startTime = '08:00';
        const [h, m] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(h, m, 0, 0);
        const endDate = addMinutes(startDate, appSettings.defaultClassDuration);
        const endTime = format(endDate, 'HH:mm');

        setFormData({
          data: new Date(),
          horarioInicio: startTime,
          horarioFim: endTime,
          instrutor: instrutores[0]?.nome || '',
          curso: defaultCurso?.nome || '',
          materia: '',
          sala: '',
          status: 'agendada',
          cor: defaultCurso?.cor || '#3b82f6',
          observacoes: '',
        });
      }
    }
  }, [isOpen, initialData, instrutores, cursos, appSettings.defaultClassDuration]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Time validation
    if (formData.horarioInicio && formData.horarioFim) {
      if (formData.horarioInicio >= formData.horarioFim) {
        showNotification('O horário de término deve ser posterior ao horário de início.', 'error');
        return;
      }
    }

    if (formData.materia && formData.instrutor && formData.curso) {
      onSave(formData as Aula);
      onClose();
    }
  };

  const handleInitialDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (initialData?.id) {
      setIsDeleting(true);
      try {
        const success = await deleteAula(initialData.id);
        if (success) {
          onClose();
        } else {
          // If delete returned false (error), stop loading state so user can try again
          setIsDeleting(false);
          setShowDeleteConfirm(false);
        }
      } catch (error) {
        console.error("Failed to delete", error);
        setIsDeleting(false);
      }
    }
  };

  const handleChange = (field: keyof Aula, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCursoChange = (nomeCurso: string) => {
    const selectedCurso = cursos.find(c => c.nome === nomeCurso);
    setFormData(prev => ({
      ...prev,
      curso: nomeCurso,
      materia: '', // Reset materia when course changes
      cor: selectedCurso ? selectedCurso.cor : prev.cor
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 dark:bg-slate-800 dark:border dark:border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {initialData ? 'Editar Aula' : 'Nova Aula'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Course first, to filter Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Curso *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={formData.curso || ''}
                onChange={(e) => handleCursoChange(e.target.value)}
              >
                <option value="" disabled>Selecione um curso...</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Matéria *</label>
              <select
                required
                disabled={!formData.curso}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white disabled:bg-gray-100 disabled:text-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
                value={formData.materia || ''}
                onChange={(e) => handleChange('materia', e.target.value)}
              >
                <option value="" disabled>
                  {formData.curso ? 'Selecione uma matéria...' : 'Selecione um curso primeiro'}
                </option>
                {filteredMaterias.map(m => (
                  <option key={m.id} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Instrutor *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={formData.instrutor || ''}
                onChange={(e) => handleChange('instrutor', e.target.value)}
              >
                <option value="" disabled>Selecione...</option>
                {instrutores.map(i => (
                  <option key={i.id} value={i.nome}>{i.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Sala</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={formData.sala || ''}
                onChange={(e) => handleChange('sala', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Data</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={formData.data ? new Date(formData.data).toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('data', new Date(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Início</label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.horarioInicio || ''}
                  onChange={(e) => handleChange('horarioInicio', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Fim</label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={formData.horarioFim || ''}
                  onChange={(e) => handleChange('horarioFim', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="agendada">Agendada</option>
                <option value="em-andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Cor</label>
              <div className="flex gap-2 mt-2">
                {['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#ef4444'].map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => handleChange('cor', c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${formData.cor === c ? 'border-gray-600 scale-110 dark:border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                * Sugestão: A cor é atualizada automaticamente ao selecionar o curso.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Observações</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              rows={3}
              value={formData.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6 dark:border-slate-700 min-h-[50px]">
            {/* Logic for Delete / Confirm Delete / Create New */}
            <div className="flex-1">
              {initialData && (
                <>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={handleInitialDeleteClick}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      <Trash2 size={16} />
                      Excluir Aula
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Tem certeza?</span>
                      <button
                        type="button"
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                      >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-slate-700"
                        title="Cancelar exclusão"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Salvar Aula
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};