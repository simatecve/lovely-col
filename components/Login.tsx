
import React, { useState } from 'react';
import { UserSession } from '../types';
import { Video, Lock, User as UserIcon, AlertCircle, Loader2, Crown } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    const inputUser = username.trim();
    const inputPass = password.trim();
    const email = inputUser.includes('@') ? inputUser : `${inputUser.toLowerCase()}@colombia1.local`;

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: inputPass
      });

      if (signInError || !signInData.user) {
        throw signInError || new Error('Auth failed');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, role, room_id')
        .eq('id', signInData.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const finalProfile = profile || {
        username: email.split('@')[0],
        full_name: email.split('@')[0],
        role: 'model',
        room_id: null
      };

      if (!profile) {
        await supabase.from('profiles').upsert({
          id: signInData.user.id,
          username: finalProfile.username,
          full_name: finalProfile.full_name,
          role: finalProfile.role,
          room_id: finalProfile.room_id
        });
      }

      const role = finalProfile.role === 'admin' || finalProfile.role === 'manager' || finalProfile.role === 'model'
        ? finalProfile.role
        : 'model';

      onLogin({
        id: signInData.user.id,
        name: finalProfile.full_name || finalProfile.username,
        role,
        username: finalProfile.username,
        roomId: finalProfile.room_id ?? undefined
      });
    } catch {
      setError('Acceso denegado. Revisa tus credenciales.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-amber-700 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-slate-900/50 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-amber-900/20 animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="text-center">
          <div className="relative mx-auto h-24 w-24 mb-8">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
            <div className="relative h-24 w-24 bg-gradient-to-b from-slate-800 to-black rounded-full flex items-center justify-center shadow-2xl border-2 border-amber-500/40">
              <Video className="text-amber-500 h-10 w-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" strokeWidth={1.5} />
              <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-2">
            <Crown className="text-amber-500 fill-amber-500" size={24} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200">
              LOVELY'S
            </span>
          </h1>
          <p className="mt-3 text-amber-500/60 font-black uppercase text-[10px] tracking-[0.4em]">Portal de Transmisión Elite</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-amber-500/40 ml-4 tracking-[0.2em]">Identificación de Usuario</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500/30 group-focus-within:text-amber-500 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USUARIO"
                  disabled={isAuthenticating}
                  required
                  className="w-full pl-14 pr-6 py-5 bg-black/40 border border-amber-900/30 rounded-2xl text-white placeholder-amber-900/50 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-bold tracking-widest text-xs disabled:opacity-50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-amber-500/40 ml-4 tracking-[0.2em]">Código de Acceso</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500/30 group-focus-within:text-amber-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isAuthenticating}
                  required
                  className="w-full pl-14 pr-6 py-5 bg-black/40 border border-amber-900/30 rounded-2xl text-white placeholder-amber-900/50 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-bold tracking-widest text-xs disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 bg-[length:200%_auto] hover:bg-right text-black rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-amber-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
          >
            {isAuthenticating ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
            {isAuthenticating ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        <div className="pt-8 border-t border-amber-900/10 text-center">
          <div className="text-[8px] text-amber-500/30 uppercase tracking-[0.3em] font-black flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
            Conexión Segura TLS 1.3 • Lovely's Studio
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
