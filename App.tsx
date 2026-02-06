
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomView from './components/RoomView';
import AIConsultant from './components/AIConsultant';
import StudioRules from './components/StudioRules';
import Login from './components/Login';
import Toast, { ToastMessage } from './components/Toast';
import { AppData, ModelRoom, StudioRules as IRules, UserSession } from './types';
import { INITIAL_DATA } from './constants';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { fetchAppState, upsertAppState } from './services/appStateService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const skipInitialSyncRef = useRef(true);

  const [currentView, setCurrentView] = useState<number | 'dashboard' | 'rules' | 'ai'>('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If not logged in, do not attempt to fetch remote state to avoid 401 error.
      // We will rely on default data or wait until login.
      if (!session) {
        setData(INITIAL_DATA);
        setIsLoadingData(false);
        return;
      }

      const remoteData = await fetchAppState();
      if (remoteData) {
        setData(remoteData);
      } else {
        setData(INITIAL_DATA);
        await upsertAppState(INITIAL_DATA);
      }
    } catch {
      setData(INITIAL_DATA);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Only resolve user if we have data or if we are not blocked by missing data
    // Actually, we want to resolve user regardless of data, 
    // but the original logic depended on [data] for some reason.
    // We'll keep it simple: resolve user independently.

    const resolveUserFromSession = async (userId?: string | null) => {
      if (!userId) {
        setCurrentUser(null);
        return;
      }
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, full_name, role, room_id')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        setCurrentUser(null);
        return;
      }

      const role = profile.role === 'admin' || profile.role === 'manager' || profile.role === 'model'
        ? profile.role
        : 'model';

      setCurrentUser({
        id: userId,
        name: profile.full_name || profile.username,
        role,
        username: profile.username,
        roomId: profile.room_id ?? undefined
      });
    };

    const loadSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      await resolveUserFromSession(sessionData.session?.user?.id);
      setIsLoadingSession(false);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      resolveUserFromSession(session?.user?.id);
      if (event === 'SIGNED_IN') {
        loadData();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadData]);

  useEffect(() => {
    if (!data || isLoadingData) return;
    if (skipInitialSyncRef.current) {
      skipInitialSyncRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      upsertAppState(data);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [data, isLoadingData]);

  useEffect(() => {
    if (!data || !currentUser) return;
    if (currentUser.role === 'model' && currentUser.roomId) {
      const exists = data.rooms.some(r => r.id === currentUser.roomId);
      if (exists) setCurrentView(currentUser.roomId);
      else setCurrentView('dashboard');
    }
  }, [currentUser, data]);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateRoom = (updatedRoom: ModelRoom) => {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rooms: prev.rooms.map(r => r.id === updatedRoom.id ? { ...updatedRoom } : r)
      };
    });
  };

  const updateRooms = (updatedRooms: ModelRoom[]) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, rooms: [...updatedRooms] };
    });
  };

  const updateRules = (updatedRules: IRules) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, rules: { ...updatedRules } };
    });
  };

  const executeLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentView('dashboard');
    sessionStorage.clear();
  };

  if (isLoadingData || isLoadingSession || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 font-black uppercase text-xs tracking-[0.4em]">Conectando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const renderContent = () => {
    const isAdmin = currentUser.role === 'admin';
    const isManager = currentUser.role === 'manager';
    
    if (currentView === 'dashboard') {
      return (isAdmin || isManager) ? <Dashboard data={data} /> : <div className="p-20 text-center text-slate-400 font-black uppercase text-xs">Acceso Restringido</div>;
    }
    if (currentView === 'rules') {
      if (!isAdmin) return <div className="p-20 text-center text-red-400 font-black uppercase text-xs">Solo Administradores</div>;
      return <StudioRules data={data} onUpdateRules={updateRules} onUpdateRooms={updateRooms} onNotify={addToast} />;
    }
    if (currentView === 'ai') {
      return (isAdmin || isManager) ? <AIConsultant data={data} /> : <div className="p-20 text-center text-slate-400 font-black uppercase text-xs">Acceso Denegado</div>;
    }
    
    const room = data.rooms.find(r => r.id === currentView);
    if (room) {
      if (currentUser.role === 'model' && currentUser.roomId !== room.id) {
        return <div className="p-20 text-center text-slate-400 font-black uppercase text-xs">Acceso Denegado</div>;
      }
      return <RoomView key={room.id} room={room} rules={data.rules} onUpdate={updateRoom} currentUser={currentUser} onNotify={addToast} />;
    }
    
    return <Dashboard data={data} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        rooms={data.rooms} 
        selectedRoomId={currentView} 
        onSelect={setCurrentView}
        currentUser={currentUser}
        onLogout={() => setShowLogoutConfirm(true)}
      />
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* SISTEMA DE NOTIFICACIONES */}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast} onClose={removeToast} />
        ))}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-inner">
                <LogOut size={40} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">¿Cerrar Sesión?</h3>
                <p className="text-slate-500 font-medium px-4">
                  Estás a punto de salir del sistema de control de <strong>Estudio Lovelys</strong>. Tendrás que ingresar tus credenciales nuevamente.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeLogout}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Sí, cerrar sesión
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  No, cancelar
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" />
                Se perderá el acceso inmediato a las salas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
