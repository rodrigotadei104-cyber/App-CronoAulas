import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Aula, FilterState, ViewMode, Stats, Instrutor, Curso, Materia, UserProfile, AppSettings, AppNotification } from '../types';
import { supabase } from '../supabaseClient';
import { parse, differenceInMinutes } from 'date-fns';
import { MOCK_AULAS, MOCK_INSTRUTORES, MOCK_CURSOS, MOCK_MATERIAS } from '../constants';

interface ScheduleContextType {
  // Auth
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  enterDemoMode: () => void;
  isDemo: boolean;

  // Data
  aulas: Aula[];
  instrutores: Instrutor[];
  cursos: Curso[];
  materias: Materia[];

  filteredAulas: Aula[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;

  addAula: (aula: Omit<Aula, 'id'>) => Promise<void>;
  updateAula: (aula: Aula) => Promise<void>;
  deleteAula: (id: string) => Promise<boolean>; // Changed to return boolean success status

  addInstrutor: (instrutor: Omit<Instrutor, 'id'>) => void;
  deleteInstrutor: (id: string) => void;

  addCurso: (curso: Omit<Curso, 'id'>) => void;
  deleteCurso: (id: string) => void;

  addMateria: (materia: Omit<Materia, 'id'>) => void;
  deleteMateria: (id: string) => void;

  stats: Stats;

  userProfile: UserProfile;
  updateUserProfile: (profile: UserProfile) => void;
  appSettings: AppSettings;
  updateAppSettings: (settings: AppSettings) => void;

  notification: AppNotification | null;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  closeNotification: () => void;

  // Workload Helpers
  getSubjectProgress: (subjectName: string, courseName: string) => { current: number, total: number, percentage: number, formattedCurrent: string, formattedTotal: string };
  getCourseProgress: (courseName: string) => { current: number, total: number, percentage: number, finalized: boolean, formattedCurrent: string, formattedTotal: string };
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// DB Mappers
const mapAulaFromDB = (data: any): Aula => ({
  id: String(data.id), // Ensure ID is always a string for consistent comparison
  data: new Date(data.data),
  horarioInicio: data.horario_inicio,
  horarioFim: data.horario_fim,
  instrutor: data.instrutor_nome,
  curso: data.curso_nome,
  materia: data.materia_nome,
  sala: data.sala,
  status: data.status,
  cor: data.cor,
  observacoes: data.observacoes
});

const mapAulaToDB = (aula: Partial<Aula>) => ({
  data: aula.data,
  horario_inicio: aula.horarioInicio,
  horario_fim: aula.horarioFim,
  instrutor_nome: aula.instrutor,
  curso_nome: aula.curso,
  materia_nome: aula.materia,
  sala: aula.sala,
  status: aula.status,
  cor: aula.cor,
  observacoes: aula.observacoes
});

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    avatarInitials: ''
  });

  // --- Data State ---
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);

  // --- UI State ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    instrutor: '',
    curso: '',
    status: 'todos',
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    defaultClassDuration: 120
  });

  const [notification, setNotification] = useState<AppNotification | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotification({ id, message, type });
    // Auto close after 3 seconds
    setTimeout(() => {
      setNotification(prev => prev?.id === id ? null : prev);
    }, 4000);
  }, []);

  const closeNotification = useCallback(() => setNotification(null), []);

  // --- Initialization & Realtime ---
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Initial Session Check
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('Session restored:', session.user.email);
          setIsAuthenticated(true);

          const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
          setUserProfile({
            name: name,
            email: session.user.email || '',
            avatarInitials: name.substring(0, 2).toUpperCase()
          });

          // 2. Fetch Tenant IMMEDIATELY after session
          await fetchUserTenant(session.user.id);
        } else {
          console.log('No active session');
          setIsAuthenticated(false);
          setIsInitialized(true); // Initialized as 'logged out'
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // 3. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (session?.user) {
        setIsAuthenticated(true);
        setIsDemo(false);

        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
        setUserProfile({
          name: name,
          email: session.user.email || '',
          avatarInitials: name.substring(0, 2).toUpperCase()
        });

        // Don't fetch tenant again if we just did it in initializeAuth
        // But do fetch if this is a new sign in
        if (event === 'SIGNED_IN') {
          await fetchUserTenant(session.user.id);
        }
      } else if (!isDemo) {
        setIsAuthenticated(false);
        setAulas([]);
        setCurrentTenant(null);
        setIsInitialized(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 4. Data Fetching Effect - STRICT DEPENDENCY
  useEffect(() => {
    if (isAuthenticated && currentTenant && !isDemo) {
      console.log('Auth and Tenant ready. Fetching data...');
      fetchData();
    } else {
      console.log('Waiting for Auth/Tenant to be ready...', { isAuthenticated, currentTenant, isDemo });
    }
  }, [currentTenant, isAuthenticated, isDemo]);

  // --- Fetchers ---
  const fetchUserTenant = async (userId?: string) => {
    try {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('Nenhum usuário autenticado para buscar tenant');
          setIsInitialized(true);
          return;
        }
        uid = user.id;
      }

      console.log('Buscando tenant para usuário ID:', uid);

      const { data, error } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar tenant:', error);
        console.log('Usando tenant padrão como fallback');
        setCurrentTenant('00000000-0000-0000-0000-000000000001');
      } else if (data && data.tenant_id) {
        console.log('Tenant encontrado e setado:', data.tenant_id);
        setCurrentTenant(data.tenant_id);
      } else {
        console.log('Nenhum tenant encontrado, usando padrão');
        setCurrentTenant('00000000-0000-0000-0000-000000000001');
      }
    } catch (e: any) {
      console.error('Erro ao buscar tenant do usuário:', e);
      setCurrentTenant('00000000-0000-0000-0000-000000000001');
    } finally {
      setIsInitialized(true);
    }
  };

  const fetchData = async () => {
    if (isDemo) return;
    if (!currentTenant) {
      console.log('Aguardando tenant...');
      return;
    }
    try {
      await Promise.all([
        fetchAulas(),
        fetchInstrutores(),
        fetchCursos(),
        fetchMaterias()
      ]);
    } catch (e: any) {
      console.error("Erro ao carregar dados.", e);
      showNotification(`Erro ao carregar dados: ${e.message || 'Verifique sua conexão'}`, 'error');
    }
  };

  const fetchAulas = async () => {
    if (!currentTenant) return;
    console.log(`Fetching aulas for tenant: ${currentTenant}`);
    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('tenant_id', currentTenant);

    if (error) {
      console.error('Error fetching aulas:', error);
      throw error;
    }

    if (data) {
      console.log(`Fetched ${data.length} aulas`);
      setAulas(data.map(mapAulaFromDB));
    }
  };

  const fetchInstrutores = async () => {
    if (!currentTenant) return;
    const { data, error } = await supabase
      .from('instrutores')
      .select('*')
      .eq('tenant_id', currentTenant);

    if (error) throw error;
    if (data) setInstrutores(data);
  };

  const fetchCursos = async () => {
    if (!currentTenant) return;
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('tenant_id', currentTenant);

    if (error) throw error;
    if (data) setCursos(data);
  };

  const fetchMaterias = async () => {
    if (!currentTenant) return;
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('tenant_id', currentTenant);

    if (error) throw error;
    if (data) {
      setMaterias(data.map((m: any) => ({
        id: m.id,
        nome: m.nome,
        cursoId: m.curso_id,
        cargaHoraria: m.carga_horaria
      })));
    }
  };


  // --- Auth Actions ---

  const enterDemoMode = useCallback(() => {
    setIsDemo(true);
    setIsAuthenticated(true);
    setCurrentTenant('demo-tenant-id'); // Set dummy tenant to satisfy strict checks
    setUserProfile({
      name: 'Visitante Demo',
      email: 'demo@cronoaulas.com',
      avatarInitials: 'DE'
    });
    setAulas(MOCK_AULAS);
    setInstrutores(MOCK_INSTRUTORES);
    setCursos(MOCK_CURSOS);
    setMaterias(MOCK_MATERIAS);
    showNotification('Modo demonstração ativado!', 'info');
  }, [showNotification]);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    showNotification('Login realizado com sucesso!', 'success');
    return true;
  }, [showNotification]);

  const register = useCallback(async (name: string, email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
    showNotification('Cadastro realizado! Verifique seu email.', 'success');
    return true;
  }, [showNotification]);

  const logout = useCallback(async () => {
    if (isDemo) {
      setIsDemo(false);
      setIsAuthenticated(false);
      setAulas([]);
    } else {
      await supabase.auth.signOut();
    }
    showNotification('Você saiu do sistema.', 'info');
  }, [isDemo, showNotification]);

  // --- User & Settings ---

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    showNotification('Perfil atualizado!', 'success');
  }, [showNotification]);

  const updateAppSettings = useCallback((settings: AppSettings) => {
    setAppSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showNotification('Configurações salvas.', 'success');
  }, [showNotification]);

  // --- CRUD Actions ---

  const addAula = useCallback(async (newAula: Omit<Aula, 'id'>) => {
    if (isDemo) {
      const aulaWithId = { ...newAula, id: Math.random().toString(36).substr(2, 9) } as Aula;
      setAulas(prev => [...prev, aulaWithId]);
      showNotification('Aula criada (Demo)', 'success');
      return;
    }

    if (!currentTenant) {
      showNotification('Erro: Tenant não identificado', 'error');
      return;
    }

    const dbPayload = {
      ...mapAulaToDB(newAula),
      tenant_id: currentTenant
    };

    const { data, error } = await supabase.from('aulas').insert(dbPayload).select().single();
    if (error) {
      console.error(error);
      showNotification('Erro ao criar aula', 'error');
    } else if (data) {
      const createdAula = mapAulaFromDB(data);
      setAulas(prev => [...prev, createdAula]);
      showNotification('Aula criada com sucesso!', 'success');
    }
  }, [isDemo, currentTenant, showNotification]);

  const updateAula = useCallback(async (updatedAula: Aula) => {
    if (isDemo) {
      setAulas(prev => prev.map(a => String(a.id) === String(updatedAula.id) ? updatedAula : a));
      showNotification('Aula atualizada (Demo)', 'success');
      return;
    }
    const dbPayload = mapAulaToDB(updatedAula);
    const { error } = await supabase.from('aulas').update(dbPayload).eq('id', updatedAula.id);
    if (error) {
      console.error(error);
      showNotification('Erro ao atualizar aula', 'error');
    } else {
      setAulas(prev => prev.map(a => String(a.id) === String(updatedAula.id) ? updatedAula : a));
      showNotification('Aula atualizada com sucesso!', 'success');
    }
  }, [isDemo, showNotification]);

  const deleteAula = useCallback(async (id: string) => {
    if (isDemo) {
      setAulas(prev => prev.filter(a => String(a.id) !== String(id)));
      showNotification('Aula removida (Demo)', 'success');
      return true;
    }

    // Explicitly casting ID to string to ensure compatibility with Supabase query if needed, 
    // although .eq() handles it well usually.
    const { error } = await supabase.from('aulas').delete().eq('id', id);

    if (error) {
      console.error("Erro ao deletar aula no Supabase:", error);
      showNotification(`Erro ao remover aula: ${error.message || 'Erro desconhecido'}`, 'error');
      return false;
    } else {
      // Immediate local update - comparing strings to avoid type issues (e.g. '123' vs 123)
      setAulas(prev => prev.filter(a => String(a.id) !== String(id)));
      showNotification('Aula removida com sucesso!', 'success');
      return true;
    }
  }, [isDemo, showNotification]);

  // Instrutores
  const addInstrutor = useCallback(async (data: Omit<Instrutor, 'id'>) => {
    if (isDemo) {
      const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
      setInstrutores(prev => [...prev, newItem]);
      showNotification('Instrutor adicionado (Demo)', 'success');
      return;
    }

    if (!currentTenant) {
      showNotification('Erro: Tenant não identificado', 'error');
      return;
    }

    const { data: newRow, error } = await supabase
      .from('instrutores')
      .insert({ ...data, tenant_id: currentTenant })
      .select()
      .single();

    if (error) {
      console.error(error);
      showNotification('Erro ao adicionar instrutor', 'error');
    } else {
      setInstrutores(prev => [...prev, newRow]);
      showNotification('Instrutor adicionado!', 'success');
    }
  }, [isDemo, currentTenant, showNotification]);

  const deleteInstrutor = useCallback(async (id: string) => {
    if (isDemo) {
      setInstrutores(prev => prev.filter(i => i.id !== id));
      showNotification('Instrutor removido (Demo)', 'success');
      return;
    }
    const { error } = await supabase.from('instrutores').delete().eq('id', id);
    if (error) {
      showNotification('Erro ao remover instrutor', 'error');
    } else {
      setInstrutores(prev => prev.filter(i => i.id !== id));
      showNotification('Instrutor removido!', 'success');
    }
  }, [isDemo, showNotification]);

  // Cursos
  const addCurso = useCallback(async (data: Omit<Curso, 'id'>) => {
    if (isDemo) {
      const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
      setCursos(prev => [...prev, newItem]);
      showNotification('Curso adicionado (Demo)', 'success');
      return;
    }

    if (!currentTenant) {
      showNotification('Erro: Tenant não identificado', 'error');
      return;
    }

    const { data: newRow, error } = await supabase.from('cursos').insert({
      nome: data.nome,
      cor: data.cor,
      carga_horaria: data.cargaHoraria,
      tenant_id: currentTenant
    }).select().single();

    if (error) {
      console.error(error);
      showNotification('Erro ao adicionar curso', 'error');
    } else {
      const mappedCurso: Curso = {
        id: newRow.id,
        nome: newRow.nome,
        cor: newRow.cor,
        cargaHoraria: newRow.carga_horaria
      };
      setCursos(prev => [...prev, mappedCurso]);
      showNotification('Curso adicionado!', 'success');
    }
  }, [isDemo, currentTenant, showNotification]);

  const deleteCurso = useCallback(async (id: string) => {
    if (isDemo) {
      setCursos(prev => prev.filter(c => c.id !== id));
      showNotification('Curso removido (Demo)', 'success');
      return;
    }
    const { error } = await supabase.from('cursos').delete().eq('id', id);
    if (error) {
      showNotification('Erro ao remover curso', 'error');
    } else {
      setCursos(prev => prev.filter(c => c.id !== id));
      showNotification('Curso removido!', 'success');
    }
  }, [isDemo, showNotification]);

  // Materias
  const addMateria = useCallback(async (data: Omit<Materia, 'id'>) => {
    if (isDemo) {
      const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
      setMaterias(prev => [...prev, newItem]);
      showNotification('Matéria adicionada (Demo)', 'success');
      return;
    }

    if (!currentTenant) {
      showNotification('Erro: Tenant não identificado', 'error');
      return;
    }

    const { data: newRow, error } = await supabase.from('materias').insert({
      nome: data.nome,
      curso_id: data.cursoId,
      carga_horaria: data.cargaHoraria,
      tenant_id: currentTenant
    }).select().single();

    if (error) {
      console.error(error);
      showNotification('Erro ao adicionar matéria', 'error');
    } else {
      const mappedMateria: Materia = {
        id: newRow.id,
        nome: newRow.nome,
        cursoId: newRow.curso_id,
        cargaHoraria: newRow.carga_horaria
      };
      setMaterias(prev => [...prev, mappedMateria]);
      showNotification('Matéria adicionada!', 'success');
    }
  }, [isDemo, currentTenant, showNotification]);

  const deleteMateria = useCallback(async (id: string) => {
    if (isDemo) {
      setMaterias(prev => prev.filter(m => m.id !== id));
      showNotification('Matéria removida (Demo)', 'success');
      return;
    }
    const { error } = await supabase.from('materias').delete().eq('id', id);
    if (error) {
      showNotification('Erro ao remover matéria', 'error');
    } else {
      setMaterias(prev => prev.filter(m => m.id !== id));
      showNotification('Matéria removida!', 'success');
    }
  }, [isDemo, showNotification]);


  // --- Derived State (Filters & Stats) ---

  const filteredAulas = useMemo(() => {
    return aulas.filter((aula) => {
      const matchesSearch =
        aula.materia.toLowerCase().includes(filters.search.toLowerCase()) ||
        aula.instrutor.toLowerCase().includes(filters.search.toLowerCase()) ||
        aula.curso.toLowerCase().includes(filters.search.toLowerCase());

      const matchesInstrutor = filters.instrutor ? aula.instrutor === filters.instrutor : true;
      const matchesCurso = filters.curso ? aula.curso === filters.curso : true;
      const matchesStatus = filters.status !== 'todos' ? aula.status === filters.status : true;

      return matchesSearch && matchesInstrutor && matchesCurso && matchesStatus;
    });
  }, [aulas, filters]);

  const stats = useMemo(() => {
    const totalAulas = filteredAulas.length;
    let totalMinutes = 0;
    const instructors = new Set<string>();
    const statusCounts: Record<string, number> = {
      agendada: 0,
      'em-andamento': 0,
      concluida: 0,
      cancelada: 0
    };

    filteredAulas.forEach(aula => {
      instructors.add(aula.instrutor);
      if (statusCounts[aula.status] !== undefined) {
        statusCounts[aula.status]++;
      }

      const start = parse(aula.horarioInicio, 'HH:mm', new Date());
      const end = parse(aula.horarioFim, 'HH:mm', new Date());
      const diff = differenceInMinutes(end, start);
      if (!isNaN(diff)) totalMinutes += diff;
    });

    return {
      totalAulas,
      totalHoras: Math.round(totalMinutes / 60),
      instrutoresAtivos: instructors.size,
      aulasPorStatus: statusCounts as any
    };
  }, [filteredAulas]);

  // --- Workload Helpers Implementation ---

  const parseWorkload = useCallback((str: string): number => {
    if (!str) return 0;
    // Handle formats like "80h", "10 h", "80"
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }, []);

  const formatWorkloadMinutes = useCallback((totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }, []);

  const getSubjectProgress = useCallback((subjectName: string, courseName: string) => {
    const subject = materias.find(m => m.nome === subjectName);
    const totalHours = subject ? parseWorkload(subject.cargaHoraria || '0h') : 0;
    const totalMinutes = totalHours * 60;

    let currentMinutes = 0;
    aulas.forEach(aula => {
      if (aula.materia === subjectName && aula.curso === courseName && aula.status !== 'cancelada') {
        const start = parse(aula.horarioInicio, 'HH:mm', new Date());
        const end = parse(aula.horarioFim, 'HH:mm', new Date());
        const diff = differenceInMinutes(end, start);
        if (!isNaN(diff)) currentMinutes += diff;
      }
    });

    const percentage = totalMinutes > 0 ? Math.min((currentMinutes / totalMinutes) * 100, 100) : 0;

    return {
      current: currentMinutes / 60,
      total: totalHours,
      percentage,
      formattedCurrent: formatWorkloadMinutes(currentMinutes),
      formattedTotal: totalHours > 0 ? `${totalHours}h` : '0h'
    };
  }, [materias, aulas, parseWorkload, formatWorkloadMinutes]);

  const getCourseProgress = useCallback((courseName: string) => {
    const course = cursos.find(c => c.nome === courseName);
    const totalHours = course ? parseWorkload(course.cargaHoraria || '0h') : 0;
    const totalMinutes = totalHours * 60;

    let currentMinutes = 0;
    aulas.forEach(aula => {
      if (aula.curso === courseName && aula.status !== 'cancelada') {
        const start = parse(aula.horarioInicio, 'HH:mm', new Date());
        const end = parse(aula.horarioFim, 'HH:mm', new Date());
        const diff = differenceInMinutes(end, start);
        if (!isNaN(diff)) currentMinutes += diff;
      }
    });

    const percentage = totalMinutes > 0 ? Math.min((currentMinutes / totalMinutes) * 100, 100) : 0;
    const finalized = totalMinutes > 0 && currentMinutes >= totalMinutes;

    return {
      current: currentMinutes / 60,
      total: totalHours,
      percentage,
      finalized,
      formattedCurrent: formatWorkloadMinutes(currentMinutes),
      formattedTotal: totalHours > 0 ? `${totalHours}h` : '0h'
    };
  }, [cursos, aulas, parseWorkload, formatWorkloadMinutes]);

  return (
    <ScheduleContext.Provider
      value={{
        isAuthenticated,
        isDemo,
        enterDemoMode,
        login,
        register,
        logout,
        aulas,
        instrutores,
        cursos,
        materias,
        filteredAulas,
        currentDate,
        setCurrentDate,
        viewMode,
        setViewMode,
        filters,
        setFilters,
        addAula,
        updateAula,
        deleteAula,
        addInstrutor,
        deleteInstrutor,
        addCurso,
        deleteCurso,
        addMateria,
        deleteMateria,
        stats,
        userProfile,
        updateUserProfile,
        appSettings,
        updateAppSettings,
        notification,
        showNotification,
        closeNotification,
        getSubjectProgress,
        getCourseProgress
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};