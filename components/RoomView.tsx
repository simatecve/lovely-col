
import React, { useState, useMemo, useEffect } from 'react';
import { ModelRoom, DailyLog, UserSession, StudioRules, SexShopItem, GlobalProduct, RoomBilling, Advance, SexShopAbono, MonitorShift, SnackConsumption } from '../types';
import { Plus, Trash2, X, ShoppingBag, Calculator, Cookie, Minus, CloudUpload, ReceiptText, Printer, Coins, DollarSign, Calendar, Clock, UserCheck, UserX, TrendingUp, AlertCircle, Search, PlusCircle, FileDown, Globe, ChevronLeft, ChevronRight, Settings2, Edit3, Check, Tag, Info, ArrowRight, ShieldCheck, ShieldAlert, ListChecks, Landmark, CreditCard, Percent, MessageSquareText, Sparkles, Briefcase, Banknote } from 'lucide-react';
import { STATUS_COLORS } from '../constants';

interface RoomViewProps {
  room: ModelRoom;
  rules: StudioRules;
  onUpdate: (updatedRoom: ModelRoom) => void;
  currentUser: UserSession;
  onNotify?: (text: string) => void;
}

const RoomView: React.FC<RoomViewProps> = ({ room, rules, onUpdate, currentUser, onNotify }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showPlatformManager, setShowPlatformManager] = useState(false);
  const [editingPlatformIdx, setEditingPlatformIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newPlatformInput, setNewPlatformInput] = useState('');
  const [snackSearch, setSnackSearch] = useState('');

  // Estados para nuevo producto Sex Shop
  const [sexShopMode, setSexShopMode] = useState<'code' | 'manual'>('code');
  const [sexShopInput, setSexShopInput] = useState({ code: '', name: '', price: 0, qty: 1, date: new Date().toISOString().split('T')[0] });

  // --- LÓGICA DE GESTIÓN DE PERIODOS INDEPENDIENTES ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodType, setPeriodType] = useState<'q1' | 'q2' | 'custom'>((new Date().getUTCDate() >= 5 && new Date().getUTCDate() <= 19) ? 'q1' : 'q2');
  
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const activePeriod = useMemo(() => {
    if (periodType === 'q1') {
      return {
        start: new Date(selectedYear, selectedMonth, 5).toISOString().split('T')[0],
        end: new Date(selectedYear, selectedMonth, 19).toISOString().split('T')[0]
      };
    } else if (periodType === 'q2') {
      const start = new Date(selectedYear, selectedMonth, 20);
      const end = new Date(selectedYear, selectedMonth + 1, 4);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    }
    return customRange;
  }, [periodType, selectedMonth, selectedYear, customRange]);

  // --- DEFINICIÓN DE PERMISOS SEGÚN ROL ---
  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const isModel = currentUser.role === 'model';

  const canEditBasic = isAdmin || isManager;
  const canEditFinances = isAdmin;
  
  const globalUsdRate = rules.usdExchangeRate || 4000;

  // --- FILTRADO POR PERIODO ACTIVO ---
  const filteredLogs = useMemo(() => {
    return (room.logs || []).filter(log => log.date >= activePeriod.start && log.date <= activePeriod.end)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [room.logs, activePeriod]);

  const filteredAdvances = useMemo(() => {
    return (room.advances || []).filter(adv => adv.date >= activePeriod.start && adv.date <= activePeriod.end);
  }, [room.advances, activePeriod]);

  const filteredSexShopAbonos = useMemo(() => {
    return (room.sexShopAbonosHistory || []).filter(abono => abono.date >= activePeriod.start && abono.date <= activePeriod.end);
  }, [room.sexShopAbonosHistory, activePeriod]);

  const filteredSexShopItems = useMemo(() => {
    return (room.sexShopItems || []).filter(item => item.date >= activePeriod.start && item.date <= activePeriod.end);
  }, [room.sexShopItems, activePeriod]);

  const filteredSnackConsumptions = useMemo(() => {
    return (room.snackConsumptions || []).filter(c => c.date >= activePeriod.start && c.date <= activePeriod.end);
  }, [room.snackConsumptions, activePeriod]);

  // --- ESTADÍSTICAS DEL PERIODO ---
  const stats = useMemo(() => {
    const totalTokens = filteredLogs.reduce((sum, log) => 
      sum + log.platformTokens.reduce((s, p) => s + p.tokens, 0), 0
    );
    const totalHours = filteredLogs.reduce((sum, log) => sum + log.totalHours, 0);
    const attended = filteredLogs.filter(log => log.status === 'present' || log.status === 'late').length;
    const absences = filteredLogs.filter(log => log.status === 'absent').length;
    return { totalTokens, totalHours, attended, absences };
  }, [filteredLogs]);

  const platformTokensMap = useMemo(() => {
    const map: Record<string, number> = {};
    room.platforms.forEach(p => map[p] = 0);
    filteredLogs.forEach(log => {
      log.platformTokens.forEach(pt => {
        if (map[pt.platform] !== undefined) map[pt.platform] += pt.tokens;
      });
    });
    return map;
  }, [filteredLogs, room.platforms]);

  const billingConfig = room.billing || {
    modelPercentage: 60,
    tokenValueUsd: 0.05,
    absencesCount: 0,
    modelCedula: '',
    bankAccount: '',
    baseSalary: 0
  };

  // --- CÁLCULOS DE LIQUIDACIÓN ---
  const dulceriaTotal = filteredSnackConsumptions.reduce((sum, cons) => {
    const product = rules.snackCatalog.find(p => p.id === cons.productId);
    return sum + (cons.quantity * (product?.unitPrice || 0));
  }, 0);
  
  const totalAdvances = filteredAdvances.reduce((sum, adv) => sum + adv.amount, 0);
  const totalSexShopItems = filteredSexShopItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalSexShopAbonos = filteredSexShopAbonos.reduce((sum, ab) => sum + ab.amount, 0);
  
  // Multa: $20 USD por cada inasistencia registrada en la liquidación * TRM
  const absencesPenalty = (billingConfig.absencesCount || 0) * 20 * globalUsdRate;

  // Liquidación para Modelos (Tokens)
  const totalGrossPesos = (stats.totalTokens * (billingConfig.modelPercentage / 100)) * (billingConfig.tokenValueUsd || 0.05) * globalUsdRate;
  
  const totalDeductions = dulceriaTotal + totalAdvances + absencesPenalty + totalSexShopItems;
  const netSalary = totalGrossPesos - totalDeductions;

  // Liquidación para Staff (Sueldo Fijo) - Sin penalidades por inasistencia para el personal de Staff
  const staffTotalDeductions = dulceriaTotal + totalAdvances + totalSexShopItems;
  const staffBaseSalary = billingConfig.baseSalary || 0;
  const staffNetSalary = staffBaseSalary - staffTotalDeductions;

  const processTransaction = (updateFn: (currentRoom: ModelRoom) => ModelRoom, allowed: boolean = canEditBasic) => {
    if (!allowed) return;
    setIsSaving(true);
    const updatedRoom = updateFn(room);
    onUpdate(updatedRoom);
    setTimeout(() => setIsSaving(false), 300);
  };

  const updateBillingField = (field: keyof RoomBilling, value: any) => {
    processTransaction(c => ({
      ...c,
      billing: {
        ...(c.billing || { 
          periodStart: activePeriod.start, 
          periodEnd: activePeriod.end, 
          modelCedula: '', 
          bankAccount: '', 
          usdExchangeRate: globalUsdRate, 
          modelPercentage: 60, 
          tokenValueUsd: 0.05, 
          absencesCount: 0,
          baseSalary: 0
        }),
        [field]: value
      }
    }), canEditFinances);
  };

  const addPlatform = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || room.platforms.includes(trimmed)) return;
    processTransaction(c => ({ ...c, platforms: [...c.platforms, trimmed] }));
    setNewPlatformInput('');
    onNotify?.(`Plataforma ${trimmed} añadida.`);
  };

  const removePlatform = (name: string) => {
    processTransaction(c => ({ ...c, platforms: c.platforms.filter(p => p !== name) }));
    onNotify?.(`Plataforma ${name} eliminada.`);
  };

  const renamePlatform = (index: number, newName: string) => {
    if (!newName.trim()) return;
    processTransaction(c => ({ ...c, platforms: c.platforms.map((p, i) => i === index ? newName.trim() : p) }));
    setEditingPlatformIdx(null);
  };

  const handleSexShopCodeChange = (code: string) => {
    const cleanCode = code.toUpperCase().trim();
    setSexShopInput(prev => ({ ...prev, code: cleanCode }));
    const product = rules.sexShopCatalog.find(p => p.code?.toUpperCase() === cleanCode);
    if (product) {
      setSexShopInput(prev => ({ ...prev, name: product.name, price: product.unitPrice }));
    }
  };

  const addSexShopProduct = () => {
    if (!sexShopInput.name || sexShopInput.price <= 0 || sexShopInput.qty <= 0) {
      onNotify?.("Información de producto incompleta");
      return;
    }
    const newItem: SexShopItem = {
      id: `ssi-${Date.now()}`,
      date: sexShopInput.date || activePeriod.start,
      code: sexShopInput.code,
      name: sexShopInput.name,
      unitPrice: sexShopInput.price,
      quantity: sexShopInput.qty
    };
    processTransaction(c => ({ ...c, sexShopItems: [...(c.sexShopItems || []), newItem] }));
    setSexShopInput(prev => ({ ...prev, code: '', name: '', price: 0, qty: 1 }));
    onNotify?.("Producto añadido a la cuenta");
  };

  const removeSexShopItem = (id: string) => {
    processTransaction(c => ({ ...c, sexShopItems: (c.sexShopItems || []).filter(i => i.id !== id) }));
  };

  const updateSnackQuantity = (productId: string, delta: number) => {
    const targetDate = activePeriod.start;
    processTransaction(c => {
      const consumptions = [...(c.snackConsumptions || [])];
      const idx = consumptions.findIndex(cs => cs.productId === productId && cs.date === targetDate);
      
      if (idx > -1) {
        const newQty = Math.max(0, consumptions[idx].quantity + delta);
        if (newQty === 0) {
          consumptions.splice(idx, 1);
        } else {
          consumptions[idx] = { ...consumptions[idx], quantity: newQty };
        }
      } else if (delta > 0) {
        consumptions.push({
          id: `cons-${Date.now()}`,
          date: targetDate,
          productId,
          quantity: delta
        });
      }
      
      return { ...c, snackConsumptions: consumptions };
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
  };

  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
      {/* HEADER & PERIOD SELECTOR */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 space-y-8 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black text-slate-800 tracking-tight">{room.name}</h2>
              {isSaving && <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 animate-pulse"><CloudUpload size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Sincronizando...</span></div>}
              {room.isMonitorRoom && (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full border border-indigo-200">
                  <ShieldCheck size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">SALA DE MONITORA</span>
                </div>
              )}
              {room.isCleaningRoom && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-200">
                  <Sparkles size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">PERSONAL DE ASEO</span>
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} className="text-indigo-500" /> Periodo Activo: <span className="text-slate-700">{activePeriod.start} al {activePeriod.end}</span>
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-1">
                    <button onClick={() => setPeriodType('q1')} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${periodType === 'q1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Q1 (5-19)</button>
                    <button onClick={() => setPeriodType('q2')} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${periodType === 'q2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Q2 (20-4)</button>
                    <button onClick={() => setPeriodType('custom')} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${periodType === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Historial</button>
                </div>
                
                {(!room.isMonitorRoom && !room.isCleaningRoom) && (
                  <div className="relative">
                     <button 
                       onClick={() => setShowPlatformManager(!showPlatformManager)}
                       className={`p-3 rounded-2xl border transition-all ${showPlatformManager ? 'bg-slate-900 text-amber-400 border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                     >
                       <Globe size={20} />
                     </button>
                     
                     {showPlatformManager && (
                       <div className="absolute right-0 top-full mt-3 w-72 bg-white border border-slate-200 shadow-2xl rounded-3xl z-[100] p-6 animate-in zoom-in-95 duration-200 overflow-hidden">
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Canales de Transmisión</h4>
                             <button onClick={() => setShowPlatformManager(false)} className="text-slate-300 hover:text-slate-500"><X size={16} /></button>
                          </div>
                          
                          {canEditBasic && (
                            <div className="flex gap-2 mb-4">
                               <input 
                                 type="text" 
                                 value={newPlatformInput} 
                                 onChange={(e) => setNewPlatformInput(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && addPlatform(newPlatformInput)}
                                 placeholder="Añadir canal..." 
                                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none" 
                               />
                               <button 
                                 onClick={() => addPlatform(newPlatformInput)}
                                 className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all"
                               >
                                 <Plus size={16} />
                               </button>
                            </div>
                          )}

                          <div className="space-y-2 mb-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                             {room.platforms.map((p, idx) => (
                               <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group">
                                  {editingPlatformIdx === idx && canEditBasic ? (
                                    <div className="flex-1 flex items-center gap-2">
                                      <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && renamePlatform(idx, editValue)} className="flex-1 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold outline-none" />
                                      <button onClick={() => renamePlatform(idx, editValue)} className="text-emerald-500"><Check size={14}/></button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-xs font-black text-slate-700">{p}</span>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         {canEditBasic && (
                                           <>
                                             <button onClick={() => {setEditingPlatformIdx(idx); setEditValue(p);}} className="p-1.5 text-slate-300 hover:text-indigo-500"><Edit3 size={14}/></button>
                                             <button onClick={() => removePlatform(p)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                           </>
                                         )}
                                      </div>
                                    </>
                                  )}
                               </div>
                             ))}
                             {room.platforms.length === 0 && (
                               <p className="text-[9px] text-slate-300 font-black uppercase text-center py-4">Sin canales asignados</p>
                             )}
                          </div>
                       </div>
                     )}
                  </div>
                )}
             </div>
             {periodType !== 'custom' ? (
                <div className="flex items-center justify-between gap-4 px-2">
                  <button onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
                  <span className="text-xs font-black uppercase text-slate-700">{months[selectedMonth]} {selectedYear}</span>
                  <button onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
                </div>
             ) : (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                   <input type="date" value={customRange.start} onChange={e => setCustomRange(prev => ({...prev, start: e.target.value}))} className="text-[10px] font-black border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-100" />
                   <span className="text-slate-300">/</span>
                   <input type="date" value={customRange.end} onChange={e => setCustomRange(prev => ({...prev, end: e.target.value}))} className="text-[10px] font-black border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
             )}
          </div>
        </div>
      </div>

      {/* MONITOR / ASEO SHIFT PLANNER */}
      {(room.isMonitorRoom || room.isCleaningRoom) && (
        <section className="space-y-6 px-4 animate-in slide-in-from-top-4">
           <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 flex items-center gap-3">
                <ListChecks size={22} /> {room.isCleaningRoom ? 'Planilla de Aseo Semanal' : 'Planilla de Turnos Semanales'}
              </h3>
           </div>
           <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b-2 border-slate-100">
                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-10 py-6">Día de la Semana</th>
                       <th className="px-10 py-6">Horario de Turno</th>
                       <th className="px-10 py-6">Personal Responsable</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {(room.monitorShifts || []).map((shift) => (
                       <tr key={shift.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-10 py-6"><span className="text-sm font-black text-slate-700">{shift.day}</span></td>
                          <td className="px-10 py-6"><div className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase w-full border border-slate-200/50">{shift.shiftType}</div></td>
                          <td className="px-10 py-6"><div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500">{shift.monitorName || '(Sin asignar)'}</div></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>
      )}

      {/* SUMMARY PANEL (Only for models) */}
      {(!room.isMonitorRoom && !room.isCleaningRoom) && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Tokens Periodo" value={stats.totalTokens.toLocaleString()} icon={<TrendingUp size={24} />} color="bg-amber-50 text-amber-500" />
          <StatCard title="Horas Periodo" value={`${stats.totalHours.toFixed(1)}h`} icon={<Clock size={24} />} color="bg-indigo-50 text-indigo-500" />
          <StatCard title="Asistencias" value={stats.attended} icon={<UserCheck size={24} />} color="bg-emerald-50 text-emerald-500" />
          <StatCard title="Faltas" value={stats.absences} icon={<UserX size={24} />} color="bg-red-50 text-red-500" />
        </section>
      )}

      {/* DAILY LOG (Only for models) */}
      {(!room.isMonitorRoom && !room.isCleaningRoom) && (
        <section className="space-y-6">
          <div className="flex justify-between items-center px-4">
             <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3"><Calculator size={18} /> Planilla de Producción ({periodType.toUpperCase()})</h3>
             {canEditBasic && <button onClick={() => processTransaction(c => ({ ...c, logs: [{ id: `log-${Date.now()}`, date: activePeriod.start, status: 'present', startTime: '08:00', endTime: '16:00', totalHours: 8, platformTokens: c.platforms.map(p => ({ platform: p, tokens: 0 })), notes: '' }, ...(c.logs || [])] }))} className="bg-slate-900 text-amber-400 px-8 py-4 rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 no-print"><Plus size={18} /> Registrar Día</button>}
          </div>
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-x-auto mx-4 overflow-hidden">
              <table className="w-full text-left min-w-[1200px]">
                <thead className="bg-slate-50 border-b-2 border-slate-100">
                  <tr>
                    <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Horas</th>
                    {room.platforms.map(p => <th key={p} className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{p}</th>)}
                    <th className="px-6 py-6 text-[11px] font-black text-amber-600 bg-amber-50/30 uppercase tracking-widest text-center">Total</th>
                    <th className="px-6 py-6 text-[11px] font-black text-indigo-500 uppercase tracking-widest text-center">Observaciones</th>
                    {canEditBasic && <th className="px-6 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest no-print">Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-6"><div className="flex flex-col"><span className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">{getDayOfWeek(log.date)}</span><input type="date" value={log.date} disabled={!canEditBasic} onChange={(e) => processTransaction(c => ({...c, logs: c.logs.map(l => l.id === log.id ? {...l, date: e.target.value} : l)}))} className="bg-transparent font-black text-slate-800 outline-none text-xs" /></div></td>
                      <td className="px-6 py-6 text-center">
                        <select value={log.status} disabled={!canEditBasic} onChange={(e) => processTransaction(c => ({...c, logs: c.logs.map(l => l.id === log.id ? {...l, status: e.target.value as any} : l)}))} className={`text-[9px] font-black px-4 py-2 rounded-xl border transition-all outline-none ${STATUS_COLORS[log.status]}`}>
                          <option value="present">ASISTIÓ</option>
                          <option value="late">TARDE</option>
                          <option value="absent">FALTA</option>
                          <option value="excused">EXCUSA</option>
                          <option value="day_off">DESCANSO</option>
                        </select>
                      </td>
                      <td className="px-6 py-6 text-center"><input type="number" step="0.5" value={log.totalHours} disabled={!canEditBasic} onChange={(e) => processTransaction(c => ({...c, logs: c.logs.map(l => l.id === log.id ? {...l, totalHours: parseFloat(e.target.value) || 0} : l)}))} className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-xs font-black" /></td>
                      {room.platforms.map(p => {
                        const platformLog = log.platformTokens.find(pt => pt.platform === p);
                        return (
                          <td key={p} className="px-6 py-6 text-center">
                            <input type="number" value={platformLog?.tokens || 0} disabled={!canEditBasic} onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                processTransaction(c => ({ ...c, logs: c.logs.map(l => l.id === log.id ? { ...l, platformTokens: l.platformTokens.some(pt => pt.platform === p) ? l.platformTokens.map(pt => pt.platform === p ? { ...pt, tokens: val } : pt) : [...l.platformTokens, { platform: p, tokens: val }] } : l) }));
                              }} className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-xs font-black" />
                          </td>
                        );
                      })}
                      <td className="px-6 py-6 text-center font-black text-amber-600 bg-amber-50/20">{log.platformTokens.reduce((s, p) => s + p.tokens, 0).toLocaleString()}</td>
                      <td className="px-6 py-6 text-center">
                         <div className="relative group/note flex items-center justify-center">
                            <input 
                              type="text" 
                              value={log.notes || ''} 
                              disabled={!canEditBasic} 
                              placeholder="Sin apuntes..."
                              onChange={(e) => processTransaction(c => ({ ...c, logs: c.logs.map(l => l.id === log.id ? { ...l, notes: e.target.value } : l) }))}
                              className="w-full min-w-[220px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 italic"
                            />
                            <div className="absolute left-1 opacity-20 group-hover/note:opacity-100 transition-opacity">
                               <MessageSquareText size={12} className="text-indigo-400" />
                            </div>
                         </div>
                      </td>
                      {canEditBasic && <td className="px-6 py-6 text-center no-print"><button onClick={() => processTransaction(c => ({...c, logs: c.logs.filter(l => l.id !== log.id)}))} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={18} /></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </section>
      )}

      {/* DULCERÍA */}
      <section className="space-y-6 px-4 no-print">
         <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 flex items-center gap-3"><Cookie size={20} /> Consumo de Dulcería (Período)</h3>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input type="text" placeholder="Buscar snack..." value={snackSearch} onChange={e => setSnackSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {rules.snackCatalog.filter(p => p.name.toLowerCase().includes(snackSearch.toLowerCase())).map(product => {
                 const cons = filteredSnackConsumptions.find(c => c.productId === product.id);
                 const qty = cons?.quantity || 0;
                 return (
                   <div key={product.id} className={`p-4 rounded-3xl border transition-all ${qty > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[10px] font-black text-slate-800 line-clamp-1 mb-1">{product.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 mb-3">${product.unitPrice.toLocaleString()}</p>
                      <div className="flex items-center justify-between bg-white rounded-2xl p-1 shadow-sm">
                         <button onClick={() => updateSnackQuantity(product.id, -1)} disabled={!canEditBasic} className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"><Minus size={14}/></button>
                         <span className="text-xs font-black text-slate-900">{qty}</span>
                         <button onClick={() => updateSnackQuantity(product.id, 1)} disabled={!canEditBasic} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><Plus size={14}/></button>
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </section>

      {/* SEX SHOP */}
      <section className="space-y-8 px-4 no-print">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-pink-600 flex items-center gap-3"><ShoppingBag size={22} /> Gestión Integral Sex Shop (Período)</h3>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button onClick={() => setSexShopMode('code')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sexShopMode === 'code' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Por Código</button>
                <button onClick={() => {setSexShopMode('manual'); setSexShopInput(prev => ({ ...prev, code: '', name: '', price: 0, qty: 1 }));}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sexShopMode === 'manual' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Ingreso Manual</button>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] shadow-sm border-2 border-pink-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
               <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fecha</label>
                  <input type="date" value={sexShopInput.date} onChange={(e) => setSexShopInput({...sexShopInput, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-pink-500" />
               </div>
               {sexShopMode === 'code' && (
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Código</label>
                    <input type="text" disabled={!canEditBasic} value={sexShopInput.code} onChange={(e) => handleSexShopCodeChange(e.target.value)} placeholder="SX-000" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50" />
                 </div>
               )}
               <div className={`${sexShopMode === 'code' ? 'md:col-span-2' : 'md:col-span-4'} space-y-2`}>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nombre Producto</label>
                  <input type="text" disabled={sexShopMode === 'code' || !canEditBasic} value={sexShopInput.name} onChange={(e) => setSexShopInput({...sexShopInput, name: e.target.value})} placeholder="Descripción..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50" />
               </div>
               <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Precio</label>
                  <input type="number" disabled={sexShopMode === 'code' || !canEditBasic} value={sexShopInput.price} onChange={(e) => setSexShopInput({...sexShopInput, price: parseInt(e.target.value)||0})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50" />
               </div>
               <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Cant.</label>
                  <input type="number" min="1" disabled={!canEditBasic} value={sexShopInput.qty} onChange={(e) => setSexShopInput({...sexShopInput, qty: Math.max(1, parseInt(e.target.value)||1)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50" />
               </div>
               <div className="md:col-span-2">
                  <button disabled={!canEditBasic} onClick={addSexShopProduct} className="w-full bg-pink-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-pink-700 transition-all font-black text-xs uppercase disabled:opacity-50">
                    <Plus size={18} /> Añadir
                  </button>
               </div>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-[2rem]">
               <table className="w-full text-left">
                  <thead className="bg-slate-50"><tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="p-5">Fecha</th><th className="p-5">Cód.</th><th className="p-5">Producto</th><th className="p-5 text-center">P. Unitario</th><th className="p-5 text-center">Cant.</th><th className="p-5 text-right">Subtotal</th><th className="p-5 text-center">Acción</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredSexShopItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors text-[10px] font-bold">
                           <td className="p-5 text-slate-400">{item.date}</td>
                           <td className="p-5 text-slate-400">{item.code || 'MANUAL'}</td>
                           <td className="p-5 text-slate-700">{item.name}</td>
                           <td className="p-5 text-center text-slate-400">${item.unitPrice.toLocaleString()}</td>
                           <td className="p-5 text-center">{item.quantity}</td>
                           <td className="p-5 text-right text-pink-600">${(item.unitPrice * item.quantity).toLocaleString()}</td>
                           <td className="p-5 text-center"><button disabled={!canEditBasic} onClick={() => removeSexShopItem(item.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </section>

      {/* FINANCES (Adelantos) */}
      <div className="px-4 no-print">
        <section className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 flex items-center gap-3"><Coins size={22} /> Adelantos en este Periodo</h3>
             {canEditFinances && <button onClick={() => processTransaction(c => ({...c, advances: [...(c.advances || []), { id: `ad-${Date.now()}`, date: activePeriod.start, concept: 'Adelanto', amount: 0 }] }), canEditFinances)} className="bg-indigo-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl shadow-lg hover:bg-indigo-700">Nuevo Adelanto</button>}
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
             {filteredAdvances.length > 0 ? filteredAdvances.map(adv => (
               <div key={adv.id} className="p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <input type="date" value={adv.date} disabled={!canEditFinances} onChange={(e) => processTransaction(c => ({...c, advances: c.advances!.map(a => a.id === adv.id ? {...a, date: e.target.value} : a)}), canEditFinances)} className="text-[10px] font-black text-slate-400 outline-none bg-transparent" />
                    {canEditFinances && <button onClick={() => processTransaction(c => ({...c, advances: c.advances!.filter(a => a.id !== adv.id)}), canEditFinances)} className="text-slate-200 hover:text-red-600 p-1"><X size={16}/></button>}
                  </div>
                  <div className="flex gap-4">
                     <input type="text" value={adv.concept} disabled={!canEditFinances} onChange={(e) => processTransaction(c => ({...c, advances: c.advances!.map(a => a.id === adv.id ? {...a, concept: e.target.value} : a)}), canEditFinances)} className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none border-b border-transparent focus:border-indigo-200 disabled:opacity-50" placeholder="Concepto..." />
                     <div className="relative w-32">
                        <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="number" value={adv.amount} disabled={!canEditFinances} onChange={(e) => processTransaction(c => ({...c, advances: c.advances!.map(a => a.id === adv.id ? {...a, amount: Math.max(0, parseInt(e.target.value)||0)} : a)}), canEditFinances)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-7 pr-3 py-2 text-sm font-black text-indigo-600 disabled:opacity-50" />
                     </div>
                  </div>
               </div>
             )) : (
               <div className="p-12 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest italic">No hay registros de adelantos para este periodo</div>
             )}
          </div>
        </section>
      </div>

      {/* LIQUIDACIÓN FINAL PARA MODELOS (Tokens) */}
      {(!room.isMonitorRoom && !room.isCleaningRoom) && (
        <section className="space-y-6 pb-20 px-4">
           <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-800 flex items-center gap-3"><ReceiptText size={22} className="text-emerald-600" /> Liquidación Independiente del Periodo</h3>
              <button onClick={() => window.print()} className="p-4 bg-slate-900 text-white rounded-[1.5rem] flex items-center gap-3 text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-xl no-print"><Printer size={18} /> Imprimir Recibo</button>
           </div>
           
           <div className="bg-white border-4 border-slate-900 rounded-none overflow-hidden shadow-2xl max-w-5xl mx-auto print:border-2">
              <div className="grid grid-cols-12 border-b-4 border-slate-900 font-black text-[11px] print:border-b-2">
                 <div className="col-span-3 p-8 flex flex-col items-center justify-center bg-slate-50 border-r-4 border-slate-900 text-center print:border-r-2">
                    <div className="bg-slate-900 text-white w-20 h-20 rounded-full flex items-center justify-center mb-4 text-4xl">L</div>
                    <p className="uppercase leading-none tracking-tighter text-base font-black">ESTUDIO LOVELY'S</p>
                 </div>
                 <div className="col-span-5 border-r-4 border-slate-900 print:border-r-2">
                    <div className="grid grid-rows-2 h-full">
                       <div className="p-6 border-b-4 border-slate-900 flex flex-col justify-center gap-2 print:border-b-2">
                          <span className="text-[9px] opacity-40 uppercase tracking-widest">Modelo / Sala</span>
                          <span className="text-2xl uppercase font-black text-slate-800">{room.name}</span>
                       </div>
                       <div className="p-6 flex flex-col justify-center gap-1 bg-indigo-50/20">
                          <span className="text-[9px] opacity-40 uppercase tracking-widest">Periodo Liquidado</span>
                          <span className="text-xs uppercase font-black text-indigo-700">{activePeriod.start} AL {activePeriod.end}</span>
                       </div>
                    </div>
                 </div>
                 <div className="col-span-4 p-6 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] opacity-40 uppercase tracking-widest">Identificación (Cédula)</span>
                      <input type="text" value={billingConfig.modelCedula} disabled={!canEditFinances} onChange={(e) => updateBillingField('modelCedula', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black uppercase outline-none" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] opacity-40 uppercase tracking-widest">Cuenta / Pago</span>
                      <input type="text" value={billingConfig.bankAccount || ''} disabled={!canEditFinances} onChange={(e) => updateBillingField('bankAccount', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black uppercase outline-none" />
                    </div>
                 </div>
              </div>

              <div className="p-8 space-y-8">
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-slate-400"><Globe size={14} /> Detalle de Producción Quincenal</h4>
                   <table className="w-full text-left border-collapse">
                      <thead className="border-b border-slate-200">
                         <tr className="text-[9px] font-black uppercase text-slate-400"><th className="py-3">Canal</th><th className="py-3 text-center">Tokens</th><th className="py-3 text-center">Valor Unit</th><th className="py-3 text-right">Total USD</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {room.platforms.map(p => {
                           const tokens = platformTokensMap[p] || 0;
                           const usdValue = tokens * (billingConfig.tokenValueUsd || 0.05);
                           return (
                             <tr key={p} className="text-[11px] font-bold text-slate-700">
                                <td className="py-3 uppercase">{p}</td>
                                <td className="py-3 text-center">{tokens.toLocaleString()}</td>
                                <td className="py-3 text-center">${(billingConfig.tokenValueUsd || 0.05).toFixed(2)}</td>
                                <td className="py-3 text-right text-emerald-600 font-black">${usdValue.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                             </tr>
                           );
                         })}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-900 bg-slate-50">
                         <tr className="text-[11px] font-black text-slate-800">
                            <td className="py-4">TOTAL PRODUCCIÓN USD</td><td className="py-4 text-center">{stats.totalTokens.toLocaleString()}</td><td className="py-4"></td><td className="py-4 text-right text-emerald-700 font-black">${(stats.totalTokens * (billingConfig.tokenValueUsd || 0.05)).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                         </tr>
                      </tfoot>
                   </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                   <div className="space-y-6">
                      <div className="p-6 bg-amber-50 rounded-[1.5rem] border border-amber-100 space-y-4">
                         <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Comisión Aplicada</span><Percent size={14} className="text-amber-500" /></div>
                         <select value={billingConfig.modelPercentage} disabled={!canEditFinances} onChange={(e) => updateBillingField('modelPercentage', parseInt(e.target.value))} className="w-full bg-white border-2 border-amber-200 rounded-xl p-3 text-lg font-black text-amber-900 outline-none">
                            <option value={60}>60%</option><option value={65}>65%</option><option value={70}>70%</option><option value={75}>75%</option><option value={80}>80%</option>
                         </select>
                         <div className="flex justify-between items-end pt-4">
                            <div><p className="text-[8px] font-black text-amber-500 uppercase opacity-60">Tasa TRM</p><p className="text-xl font-black text-slate-900">${globalUsdRate.toLocaleString()}</p></div>
                            <div className="text-right">
                               <p className="text-[8px] font-black text-amber-500 uppercase opacity-60">Subtotal en COP</p>
                               <p className="text-2xl font-black text-slate-900">${totalGrossPesos.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-slate-400"><Minus size={14} /> Deducciones del Periodo</h4>
                      <div className="space-y-3">
                         <div className="flex justify-between items-center text-[11px] font-bold text-slate-600"><span>Tienda Sex Shop (Compras):</span><span className="font-black text-red-500">-${totalSexShopItems.toLocaleString()}</span></div>
                         <div className="flex justify-between items-center text-[11px] font-bold text-slate-600"><span>Consumo Dulcería:</span><span className="font-black text-red-500">-${dulceriaTotal.toLocaleString()}</span></div>
                         <div className="flex justify-between items-center text-[11px] font-bold text-slate-600"><span>Adelantos Recibidos:</span><span className="font-black text-red-500">-${totalAdvances.toLocaleString()}</span></div>
                         
                         <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 group/penalty">
                            <div className="flex items-center gap-2">
                               <span>Inasistencias:</span>
                               <input 
                                 type="number" 
                                 min="0"
                                 disabled={!canEditFinances}
                                 value={billingConfig.absencesCount || 0} 
                                 onChange={(e) => updateBillingField('absencesCount', parseInt(e.target.value) || 0)}
                                 className="w-12 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-center text-[10px] font-black outline-none focus:ring-1 focus:ring-red-200 no-print"
                               />
                               <span className="print:inline hidden">({billingConfig.absencesCount || 0})</span>
                               <span className="text-[8px] text-slate-300 font-bold uppercase no-print italic">(x $20 USD c/u)</span>
                            </div>
                            <span className="font-black text-red-500">-${absencesPenalty.toLocaleString()}</span>
                         </div>

                         {totalSexShopAbonos > 0 && <div className="flex justify-between items-center text-[11px] font-bold text-slate-600"><span>Abonos Realizados:</span><span className="font-black text-emerald-500">+${totalSexShopAbonos.toLocaleString()}</span></div>}
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="text-center md:text-left space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-400">PAGO NETO FINAL</p>
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest italic">Toda la información corresponde al rango {activePeriod.start} a {activePeriod.end}</p>
                 </div>
                 <div className="text-center md:text-right">
                    <p className="text-5xl font-black text-white tracking-tighter">${(netSalary + totalSexShopAbonos).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                    <p className="text-[10px] font-bold text-emerald-500/80 uppercase mt-1 tracking-widest">Giro Autorizado • Lovely's Studio</p>
                 </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-100 space-y-4">
                 <p className="text-[10px] font-black text-slate-800 uppercase text-center tracking-widest leading-relaxed">
                    PAGO DE MONETIZACION QUE LOVELY´S ESTUDIO REALIZA SEGUN EL CONTRATO DE MANDATO-MANDATARIO ANTES FIRMADO.
                 </p>
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl italic text-[9px] text-slate-500 font-bold text-center leading-relaxed">
                    NOTA: las fotos y el kid de inicio se cobran ya que la modelo se retira antes del primer mes de lo contrario el estudio se haria cargo de esos gastos como lo especifica el contrato
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* LIQUIDACIÓN DE STAFF (Monitoras y Aseo) */}
      {(room.isMonitorRoom || room.isCleaningRoom) && (
        <section className="space-y-6 pb-20 px-4">
           <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-700 flex items-center gap-3"><ReceiptText size={22} className="text-indigo-600" /> Recibo de Pago de Quincena (Staff)</h3>
              <button onClick={() => window.print()} className="p-4 bg-indigo-900 text-white rounded-[1.5rem] flex items-center gap-3 text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-xl no-print"><Printer size={18} /> Imprimir Recibo</button>
           </div>
           
           <div className="bg-white border-4 border-indigo-900 rounded-none overflow-hidden shadow-2xl max-w-5xl mx-auto print:border-2">
              {/* Header Recibo Staff */}
              <div className="grid grid-cols-12 border-b-4 border-indigo-900 font-black text-[11px] print:border-b-2">
                 <div className="col-span-3 p-8 flex flex-col items-center justify-center bg-indigo-50 border-r-4 border-indigo-900 text-center print:border-r-2">
                    <div className="bg-indigo-900 text-white w-20 h-20 rounded-full flex items-center justify-center mb-4 text-4xl">S</div>
                    <p className="uppercase leading-none tracking-tighter text-base font-black text-indigo-900">STAFF LOVELY'S</p>
                 </div>
                 <div className="col-span-5 border-r-4 border-indigo-900 print:border-r-2">
                    <div className="grid grid-rows-2 h-full">
                       <div className="p-6 border-b-4 border-indigo-900 flex flex-col justify-center gap-2 print:border-b-2">
                          <span className="text-[9px] opacity-40 uppercase tracking-widest">Nombre del Colaborador</span>
                          <span className="text-2xl uppercase font-black text-indigo-800">{room.name}</span>
                       </div>
                       <div className="p-6 flex flex-col justify-center gap-1 bg-indigo-50/20">
                          <span className="text-[9px] opacity-40 uppercase tracking-widest">Periodo Laborado</span>
                          <span className="text-xs uppercase font-black text-indigo-700">{activePeriod.start} AL {activePeriod.end}</span>
                       </div>
                    </div>
                 </div>
                 <div className="col-span-4 p-6 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] opacity-40 uppercase tracking-widest">Cédula Ciudadanía</span>
                      <input type="text" value={billingConfig.modelCedula} disabled={!canEditFinances} onChange={(e) => updateBillingField('modelCedula', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black uppercase outline-none" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] opacity-40 uppercase tracking-widest">Cuenta de Cobro / Banco</span>
                      <input type="text" value={billingConfig.bankAccount || ''} disabled={!canEditFinances} onChange={(e) => updateBillingField('bankAccount', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black uppercase outline-none" />
                    </div>
                 </div>
              </div>

              <div className="p-8 space-y-10">
                 {/* Sueldo Base Form */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="p-8 bg-indigo-50/50 border-2 border-indigo-100 rounded-[2rem] space-y-6">
                       <div className="flex items-center gap-3 text-indigo-900">
                          <Banknote size={24} />
                          <h4 className="text-sm font-black uppercase tracking-widest">Asignación Salarial</h4>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-indigo-400 ml-2">Sueldo Base Quincenal (COP)</label>
                          <div className="relative">
                             <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
                             <input 
                               type="number" 
                               value={billingConfig.baseSalary || 0} 
                               disabled={!canEditFinances}
                               onChange={(e) => updateBillingField('baseSalary', parseInt(e.target.value) || 0)}
                               className="w-full pl-12 pr-6 py-5 bg-white border-2 border-indigo-100 rounded-2xl text-2xl font-black text-indigo-900 outline-none focus:border-indigo-500 no-print" 
                             />
                             <div className="hidden print:block text-2xl font-black text-indigo-900 p-4 border-2 border-transparent">
                               ${(billingConfig.baseSalary || 0).toLocaleString()}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><Minus size={14} /> Deducciones y Descuentos</h4>
                       <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                          <div className="flex justify-between items-center text-[12px] font-bold text-slate-600">
                             <span>Consumo Dulcería Interno:</span>
                             <span className="font-black text-red-500">-${dulceriaTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[12px] font-bold text-slate-600">
                             <span>Adelantos de Quincena:</span>
                             <span className="font-black text-red-500">-${totalAdvances.toLocaleString()}</span>
                          </div>
                          {totalSexShopItems > 0 && (
                             <div className="flex justify-between items-center text-[12px] font-bold text-slate-600">
                                <span>Compras Sex Shop:</span>
                                <span className="font-black text-red-500">-${totalSexShopItems.toLocaleString()}</span>
                             </div>
                          )}
                          <div className="pt-4 mt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center text-[12px] font-black text-slate-900 uppercase">
                             <span>Total Deducciones:</span>
                             <span className="text-red-600">-${staffTotalDeductions.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Pie de Recibo Staff */}
              <div className="p-10 bg-indigo-900 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="text-center md:text-left space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-300">TOTAL NETO A RECIBIR</p>
                    <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest italic leading-relaxed">
                       VALOR A PAGAR CORRESPONDIENTE A LA LABOR DESEMPEÑADA <br/>
                       DEL {activePeriod.start} AL {activePeriod.end}
                    </p>
                 </div>
                 <div className="text-center md:text-right">
                    <p className="text-6xl font-black text-white tracking-tighter">${(staffNetSalary).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase mt-2 tracking-widest">Liquidación Autorizada • Gestión de Talento Lovely's</p>
                 </div>
              </div>
           </div>
        </section>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
    </div>
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>{icon}</div>
  </div>
);

export default RoomView;
