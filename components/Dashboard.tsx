
import React, { useMemo } from 'react';
import { AppData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Coins, Clock, Activity, TrendingUp } from 'lucide-react';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const stats = useMemo(() => {
    let totalTokens = 0;
    let totalHours = 0;
    let totalSessions = 0;

    data.rooms.forEach(room => {
      room.logs.forEach(log => {
        totalHours += log.totalHours;
        totalSessions += 1;
        log.platformTokens.forEach(p => totalTokens += p.tokens);
      });
    });

    return { totalTokens, totalHours, totalSessions };
  }, [data]);

  const platformData = useMemo(() => {
    const totals: Record<string, number> = {};
    data.rooms.forEach(room => {
      room.logs.forEach(log => {
        log.platformTokens.forEach(p => {
          totals[p.platform] = (totals[p.platform] || 0) + p.tokens;
        });
      });
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Consola Maestro</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Control total de Tokens y Operaciones</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Tokens Globales" value={stats.totalTokens.toLocaleString()} icon={<Coins size={24} className="text-amber-500" />} color="bg-amber-50" />
        <StatCard title="Horas Totales" value={`${stats.totalHours.toFixed(0)}h`} icon={<Clock size={24} className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="Sesiones" value={stats.totalSessions} icon={<Activity size={24} className="text-emerald-500" />} color="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="text-lg font-black mb-8 uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Tokens por Plataforma
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '16px', border: 'none', padding: '12px' }}
                   cursor={{ fill: '#f8fafc' }}
                   formatter={(value: any) => [value.toLocaleString(), 'Tokens']}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                   {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center space-y-4">
           <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-200">
              <Activity size={32} />
           </div>
           <h3 className="text-xl font-black text-slate-800">Estado de Operación</h3>
           <p className="text-xs text-slate-500 font-medium leading-relaxed">
              El sistema está procesando actualmente <strong>30 salas</strong> en tiempo real. 
              Monitorea el rendimiento global y asegúrate de que todas las salas cumplan con sus metas diarias.
           </p>
           <div className="w-full pt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <span>Salas Activas</span>
                 <span>100%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 w-[100%]"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
      <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
    </div>
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>{icon}</div>
  </div>
);

export default Dashboard;
