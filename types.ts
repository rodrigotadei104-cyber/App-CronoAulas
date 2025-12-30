export type ClassStatus = 'agendada' | 'em-andamento' | 'concluida' | 'cancelada';

export interface Aula {
  id: string;
  data: Date;
  horarioInicio: string; // "08:00"
  horarioFim: string;    // "10:00"
  instrutor: string;
  curso: string;
  materia: string;
  sala?: string;
  status: ClassStatus;
  cor?: string; // Hex para identificação visual
  observacoes?: string;
}

export interface Instrutor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

export interface Curso {
  id: string;
  nome: string;
  cargaHoraria?: string; // Ex: "40h"
  cor: string;
}

export interface Materia {
  id: string;
  nome: string;
  cursoId: string; // Link to Curso
  cargaHoraria?: string; // Ex: "60h"
}

export type ViewMode = 'dashboard' | 'daily' | 'monthly' | 'annual' | 'registrations';

export interface FilterState {
  search: string;
  instrutor: string;
  curso: string;
  status: ClassStatus | 'todos';
}

export interface UserProfile {
  name: string;
  email: string;
  avatarInitials: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultClassDuration: number; // in minutes
}

export interface Stats {
  totalAulas: number;
  totalHoras: number;
  instrutoresAtivos: number;
  aulasPorStatus: Record<ClassStatus, number>;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}