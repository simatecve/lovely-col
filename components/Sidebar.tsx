
import React from 'react';
import { LayoutDashboard, Settings, BrainCircuit, User, LogOut, ShieldCheck, Crown } from 'lucide-react';
import { ModelRoom, UserSession } from '../types';

interface SidebarProps {
  rooms: ModelRoom[];
  selectedRoomId: number | 'dashboard' | 'rules' | 'ai';
  onSelect: (id: number | 'dashboard' | 'rules' | 'ai') => void;
  currentUser: UserSession;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ rooms, selectedRoomId, onSelect, currentUser, onLogout }) => {
  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const isModel = currentUser.role === 'model';

  const visibleRooms = isModel 
    ? rooms.filter(r => r.id === currentUser.roomId)
    : rooms;

  const roleLabels: Record<string, string> = {
    admin: 'Administrador Elite',
    manager: 'Monitora Master',
    model: 'Modelo Estrella'
  };

  return (
    <div className="w-64 h-screen bg-black text-white flex flex-col fixed left-0 top-0 overflow-hidden z-50 border-r border-amber-900/30">
      {/* Brand Header */}
      <div className="p-8 border-b border-amber-900/20">
        <h1 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
          <Crown className="text-amber-500 fill-amber-500" size={24} />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200">
            LOVELY'S
          </span>
        </h1>
        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 border border-amber-500/30">
          <ShieldCheck size={12} />
          {roleLabels[currentUser.role]}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {(isAdmin || isManager) && (
          <button
            onClick={() => onSelect('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              selectedRoomId === 'dashboard' 
                ? 'bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black shadow-lg shadow-amber-900/20' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-sm uppercase tracking-widest">Tablero</span>
          </button>
        )}
        
        {(isAdmin || isManager) && (
          <button
            onClick={() => onSelect('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              selectedRoomId === 'ai' 
                ? 'bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black shadow-lg shadow-amber-900/20' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <BrainCircuit size={20} />
            <span className="text-sm uppercase tracking-widest">Asistente Lovelys</span>
          </button>
        )}

        <div className="pt-8 pb-3 text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em] px-4">
          {isModel ? 'Mi Terminal' : 'Gestión de Salas'}
        </div>
        
        <div className="space-y-1">
          {visibleRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelect(room.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                selectedRoomId === room.id 
                  ? 'bg-white/10 text-amber-400 border-l-2 border-amber-500' 
                  : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'
              }`}
            >
              <User size={16} className={selectedRoomId === room.id ? 'text-amber-500' : 'text-slate-700'} />
              <span className="font-bold tracking-wide">{room.name || `Sala ${room.id}`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-amber-900/20 space-y-2 bg-black/50">
        {isAdmin && (
          <button
            onClick={() => onSelect('rules')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              selectedRoomId === 'rules' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400'
            }`}
          >
            <Settings size={20} className="text-amber-500" />
            <span className="text-xs font-black uppercase tracking-widest">Ajustes</span>
          </button>
        )}
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <LogOut size={20} />
          Salir del Portal
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
