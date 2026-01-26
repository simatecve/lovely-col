
import React, { useState, useMemo } from 'react';
import { StudioRules as IRules, AppData, StudioUser, ModelRoom, Role, GlobalProduct, MonitorShift, RoomBilling, StudioExpense, IncomeRecord } from '../types';
import { Save, Plus, Building2, UserPlus, Trash2, Loader2, Shield, User, Search, Utensils, Tag, DollarSign, X, Settings2, Coins, Box, ShoppingCart, PackageOpen, ArrowDownCircle, Wallet, Landmark, ShoppingBag, Hash, PlusCircle, UserCog, KeyRound, DoorOpen, ShieldCheck, CheckCircle2, Lock, Eye, Calendar, Clock, ListChecks, CreditCard, IdCard, TrendingUp, TrendingDown, Receipt, Briefcase, AlertCircle } from 'lucide-react';

interface RulesProps {
  data: AppData;
  onUpdateRules: (updatedRules: IRules) => void;
  onUpdateRooms: (updatedRooms: ModelRoom[]) => void;
  onNotify?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const StudioRules: React.FC<RulesProps> = ({ data, onUpdateRules, onUpdateRooms, onNotify }) => {
  const [localRules, setLocalRules] = useState<IRules>(data.rules);
  const [localRooms, setLocalRooms] = useState<ModelRoom[]>(data.rooms);
  const [activeTab, setActiveTab] = useState<'rooms' | 'users' | 'catalog' | 'general' | 'inventory' | 'sexshop_inventory'>('users');
  const [hasChanges, setHasChanges] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonitorRoomId, setSelectedMonitorRoomId] = useState<number | null>(null);

  // Estados para formularios rápidos
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, code: '' });
  
  // Estados para Gastos e Ingresos
  const [newExpense, setNewExpense] = useState<Partial<StudioExpense>>({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Operativo' });
  const [newIncome, setNewIncome] = useState<Partial<IncomeRecord>>({ platform: 'Chaturbate', amountUsdPaid: 0, amountUsdReceived: 0, date: new Date().toISOString().split('T')[0] });

  // Estado para nuevo usuario
  const [newUser, setNewUser] = useState<Partial<StudioUser>>({
    name: '',
    username: '',
    password: '',
    role: 'model',
    roomId: 1
  });

  // --- LÓGICA DULCERÍA ---
  const globalSalesMap = useMemo(() => {
    const map: Record<string, number> = {};
    localRooms.forEach(room => {
      if (room.dulceriaQuantities) {
        Object.entries(room.dulceriaQuantities).forEach(([prodId, qty]) => {
          map[prodId] = (map[prodId] || 0) + (qty as number);
        });
      }
    });
    return map;
  }, [localRooms]);

  const inventoryFinance = useMemo(() => {
    return (localRules.snackCatalog || []).reduce((acc, p) => {
      const vendidos = globalSalesMap[p.id] || 0;
      const disponible = (p.initialStock || 0) - vendidos;
      acc.totalSalesValue += vendidos * p.unitPrice;
      acc.totalStockValue += (disponible > 0 ? disponible : 0) * p.unitPrice;
      return acc;
    }, { totalSalesValue: 0, totalStockValue: 0 });
  }, [localRules.snackCatalog, globalSalesMap]);

  // --- LÓGICA SEX SHOP ---
  const globalSexShopSalesMap = useMemo(() => {
    const map: Record<string, number> = {};
    localRooms.forEach(room => {
      if (room.sexShopItems) {
        room.sexShopItems.forEach(item => {
          const key = item.name.toLowerCase().trim();
          map[key] = (map[key] || 0) + (item.quantity || 1);
        });
      }
    });
    return map;
  }, [localRooms]);

  const sexShopFinance = useMemo(() => {
    return (localRules.sexShopCatalog || []).reduce((acc, p) => {
      const nameKey = p.name.toLowerCase().trim();
      const vendidos = globalSexShopSalesMap[nameKey] || 0;
      const disponible = (p.initialStock || 0) - vendidos;
      acc.totalSalesValue += vendidos * p.unitPrice;
      acc.totalStockValue += (disponible > 0 ? disponible : 0) * p.unitPrice;
      return acc;
    }, { totalSalesValue: 0, totalStockValue: 0 });
  }, [localRules.sexShopCatalog, globalSexShopSalesMap]);

  // --- LÓGICA DE MULTAS AUTOMÁTICAS ---
  const totalModelPenalties = useMemo(() => {
    return localRooms.reduce((sum, room) => {
      if (room.isMonitorRoom || room.isCleaningRoom) return sum;
      const absences = room.billing?.absencesCount || 0;
      return sum + (absences * 20 * localRules.usdExchangeRate);
    }, 0);
  }, [localRooms, localRules.usdExchangeRate]);

  const handleSaveAll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpdateRules(localRules);
      onUpdateRooms(localRooms);
      setHasChanges(false);
      setIsProcessing(false);
      if (onNotify) onNotify('¡Sincronización Global Completa!', 'success');
    }, 800);
  };

  const handleAddRoom = () => {
    const newId = localRooms.length > 0 ? Math.max(...localRooms.map(r => r.id)) + 1 : 1;
    const newRoom: ModelRoom = {
      id: newId,
      name: `Nueva Sala ${newId}`,
      platforms: ['Chaturbate', 'Stripchat'],
      commissionRate: 0.5,
      logs: [],
      sexShopItems: [],
      sexShopAbonosHistory: [],
      dulceriaQuantities: {},
      advances: [],
      billing: {
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        modelCedula: '',
        bankAccount: '',
        usdExchangeRate: localRules.usdExchangeRate,
        modelPercentage: 60,
        tokenValueUsd: 0.05,
        absencesCount: 0
      }
    };
    setLocalRooms(prev => [newRoom, ...prev]);
    setHasChanges(true);
    if (onNotify) onNotify('Nueva sala agregada', 'info');
  };

  const handleDeleteRoom = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta sala? Se perderán todos sus registros.')) {
      setLocalRooms(prev => prev.filter(r => r.id !== id));
      setHasChanges(true);
      if (onNotify) onNotify('Sala eliminada', 'error');
    }
  };

  const updateRoomBillingField = (roomId: number, field: keyof RoomBilling, value: any) => {
    setLocalRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const currentBilling = room.billing || {
          periodStart: '',
          periodEnd: '',
          modelCedula: '',
          bankAccount: '',
          usdExchangeRate: localRules.usdExchangeRate,
          modelPercentage: 60,
          tokenValueUsd: 0.05,
          absencesCount: 0
        };
        return {
          ...room,
          billing: { ...currentBilling, [field]: value }
        };
      }
      return room;
    }));
    setHasChanges(true);
  };

  const addCatalogItem = (type: 'snack' | 'sexshop') => {
    if (!newProduct.name.trim()) return;
    const item: GlobalProduct = { 
      id: `p-${Date.now()}`, 
      name: newProduct.name.trim(), 
      unitPrice: newProduct.price, 
      initialStock: 0,
      code: newProduct.code 
    };

    if (type === 'snack') {
      setLocalRules(prev => ({ ...prev, snackCatalog: [...(prev.snackCatalog || []), item] }));
    } else {
      setLocalRules(prev => ({ ...prev, sexShopCatalog: [...(prev.sexShopCatalog || []), item] }));
    }

    setNewProduct({ name: '', price: 0, code: '' });
    setShowAddForm(false);
    setHasChanges(true);
    if (onNotify) onNotify('Producto añadido correctamente', 'info');
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.username || !newUser.password) {
      if (onNotify) onNotify('Por favor completa todos los campos del usuario', 'error');
      return;
    }
    
    const user: StudioUser = {
      id: `user-${Date.now()}`,
      name: newUser.name!,
      username: newUser.username!.toLowerCase().trim(),
      password: newUser.password!,
      role: newUser.role as Role,
      roomId: newUser.role === 'model' ? newUser.roomId : undefined
    };

    setLocalRules(prev => ({
      ...prev,
      accounts: [...prev.accounts, user]
    }));
    
    setNewUser({ name: '', username: '', password: '', role: 'model', roomId: 1 });
    setShowAddForm(false);
    setHasChanges(true);
    if (onNotify) onNotify('Nuevo usuario creado exitosamente', 'success');
  };

  const updateItem = (type: 'snack' | 'sexshop', id: string, field: keyof GlobalProduct, value: any) => {
    const listName = type === 'snack' ? 'snackCatalog' : 'sexShopCatalog';
    setLocalRules(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
    setHasChanges(true);
  };

  const updateGlobalSetting = (field: keyof IRules, value: any) => {
    setLocalRules(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddExpense = () => {
    if (!newExpense.description || (newExpense.amount || 0) <= 0) return;
    const expense: StudioExpense = {
      id: `exp-${Date.now()}`,
      date: newExpense.date!,
      description: newExpense.description,
      amount: newExpense.amount!,
      category: newExpense.category
    };
    setLocalRules(prev => ({ ...prev, expenses: [expense, ...(prev.expenses || [])] }));
    setNewExpense({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Operativo' });
    setHasChanges(true);
    if (onNotify) onNotify('Gasto registrado', 'info');
  };

  const handleAddIncome = () => {
    if (!newIncome.platform || (newIncome.amountUsdPaid || 0) <= 0) return;
    const totalCop = (newIncome.amountUsdReceived || 0) * (localRules.usdExchangeRate || 4000);
    const income: IncomeRecord = {
      id: `inc-${Date.now()}`,
      date: newIncome.date!,
      platform: newIncome.platform!,
      amountUsdPaid: newIncome.amountUsdPaid!,
      amountUsdReceived: newIncome.amountUsdReceived!,
      exchangeRate: localRules.usdExchangeRate,
      totalCop: totalCop
    };
    setLocalRules(prev => ({ ...prev, incomeRecords: [income, ...(prev.incomeRecords || [])] }));
    setNewIncome({ platform: 'Chaturbate', amountUsdPaid: 0, amountUsdReceived: 0, date: new Date().toISOString().split('T')[0] });
    setHasChanges(true);
    if (onNotify) onNotify('Ingreso registrado', 'success');
  };

  const updateMonitorShiftAdmin = (roomId: number, shiftId: string, field: keyof MonitorShift, value: any) => {
    setLocalRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          monitorShifts: (room.monitorShifts || []).map(s => s.id === shiftId ? { ...s, [field]: value } : s)
        };
      }
      return room;
    }));
    setHasChanges(true);
  };

  const ROLE_BADGES: Record<Role, string> = {
    admin: 'bg-amber-100 text-amber-700 border-amber-200',
    manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    model: 'bg-pink-100 text-pink-700 border-pink-200'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Shield className="text-indigo-600" size={32} />
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Administración Central</h2>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Usuarios</button>
            <button onClick={() => setActiveTab('rooms')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'rooms' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Salas</button>
            <button onClick={() => setActiveTab('catalog')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'catalog' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Catálogos</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Inv. Dulcería</button>
            <button onClick={() => setActiveTab('sexshop_inventory')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sexshop_inventory' ? 'bg-pink-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Inv. Sex Shop</button>
            <button onClick={() => setActiveTab('general')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>General</button>
          </div>
        </div>
        <button onClick={handleSaveAll} disabled={isProcessing} className={`${hasChanges ? 'bg-pink-600 shadow-pink-200 ring-4 ring-pink-50' : 'bg-slate-900 shadow-slate-900/30'} text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase shadow-2xl hover:opacity-95 flex items-center gap-3 active:scale-95 disabled:opacity-50 transition-all`}>
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {hasChanges ? 'Guardar Cambios' : 'Sincronizado'}
        </button>
      </header>

      {/* --- PESTAÑA USUARIOS --- */}
      {activeTab === 'users' && (
        <section className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
           {/* Formulario de creación */}
           <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 flex items-center gap-3"><UserPlus size={20} /> Alta de Nuevo Miembro</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase">Configuración de Accesos y Privilegios</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Nombre Completo</label>
                    <input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Ej: Monica Perez" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Usuario Login</label>
                    <input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="monica_p" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Contraseña</label>
                    <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="••••••" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Rol / Permisos</label>
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-[10px] font-black uppercase focus:ring-2 focus:ring-amber-500 outline-none">
                       <option value="model">Modelo Estrella</option>
                       <option value="manager">Monitora Master</option>
                       <option value="admin">Administrador Elite</option>
                    </select>
                 </div>
                 {newUser.role === 'model' && (
                   <div className="space-y-1 animate-in zoom-in-95">
                      <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Asignar Sala</label>
                      <select value={newUser.roomId} onChange={e => setNewUser({...newUser, roomId: parseInt(e.target.value)})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-[10px] font-black uppercase focus:ring-2 focus:ring-amber-500 outline-none">
                         {localRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                   </div>
                 )}
              </div>
              <button onClick={handleAddUser} className="w-full bg-amber-500 text-black p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-3">
                 <Plus size={20} /> Incorporar al Staff del Estudio
              </button>
           </div>

           {/* Tabla de Gestión */}
           <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-3"><UserCog size={20} className="text-indigo-600" /> Directorio Staff & Privilegios</h3>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Buscar por nombre o login..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-80" />
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50">
                       <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="py-6 px-10">Miembro Staff</th>
                          <th className="py-6 px-10">Login</th>
                          <th className="py-6 px-10">Clave de Acceso</th>
                          <th className="py-6 px-10 text-center">Rol Asignado</th>
                          <th className="py-6 px-10 text-center">Sala Vinculada</th>
                          <th className="py-6 px-10 text-center">Gestión</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {(localRules.accounts || []).filter(acc => acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.username.toLowerCase().includes(searchTerm.toLowerCase())).map(acc => (
                          <tr key={acc.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="py-5 px-10">
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${ROLE_BADGES[acc.role]}`}>
                                      {acc.name.charAt(0)}
                                   </div>
                                   <input value={acc.name} onChange={(e) => {
                                      setLocalRules(p => ({...p, accounts: p.accounts.map(u => u.id === acc.id ? {...u, name: e.target.value} : u)}));
                                      setHasChanges(true);
                                   }} className="bg-transparent font-black text-slate-800 text-sm outline-none w-full" />
                                </div>
                             </td>
                             <td className="py-5 px-10">
                                <div className="flex items-center gap-2">
                                   <User size={14} className="text-slate-300" />
                                   <input value={acc.username} onChange={(e) => {
                                      setLocalRules(p => ({...p, accounts: p.accounts.map(u => u.id === acc.id ? {...u, username: e.target.value.toLowerCase().trim()} : u)}));
                                      setHasChanges(true);
                                   }} className="bg-slate-100/50 px-3 py-1.5 rounded-lg font-mono text-xs w-full outline-none focus:bg-white border border-transparent focus:border-indigo-100" />
                                </div>
                             </td>
                             <td className="py-5 px-10">
                                <div className="flex items-center gap-2">
                                   <KeyRound size={14} className="text-slate-300" />
                                   <input value={acc.password} onChange={(e) => {
                                      setLocalRules(p => ({...p, accounts: p.accounts.map(u => u.id === acc.id ? {...u, password: e.target.value} : u)}));
                                      setHasChanges(true);
                                   }} className="bg-slate-100/50 px-3 py-1.5 rounded-lg font-mono text-xs w-full outline-none focus:bg-white border border-transparent focus:border-indigo-100 text-indigo-600 font-black" />
                                </div>
                             </td>
                             <td className="py-5 px-10 text-center">
                                <select value={acc.role} onChange={(e) => {
                                   const newRole = e.target.value as Role;
                                   setLocalRules(p => ({...p, accounts: p.accounts.map(u => u.id === acc.id ? {...u, role: newRole, roomId: newRole === 'model' ? (u.roomId || 1) : undefined} : u)}));
                                   setHasChanges(true);
                                }} className={`text-[9px] font-black px-4 py-2 rounded-xl border-2 outline-none transition-all appearance-none cursor-pointer ${ROLE_BADGES[acc.role]}`}>
                                   <option value="admin">ADMIN</option>
                                   <option value="manager">MONITORA</option>
                                   <option value="model">MODELO</option>
                                </select>
                             </td>
                             <td className="py-5 px-10 text-center">
                                {acc.role === 'model' ? (
                                   <div className="flex items-center justify-center gap-2">
                                      <DoorOpen size={14} className="text-slate-300" />
                                      <select value={acc.roomId} onChange={(e) => {
                                         setLocalRules(p => ({...p, accounts: p.accounts.map(u => u.id === acc.id ? {...u, roomId: parseInt(e.target.value)} : u)}));
                                         setHasChanges(true);
                                      }} className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 text-[10px] font-black text-slate-700 outline-none">
                                         {localRooms.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
                                      </select>
                                   </div>
                                ) : <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">N/A</span>}
                             </td>
                             <td className="py-5 px-10 text-center">
                                <button onClick={() => {
                                   setLocalRules(p => ({...p, accounts: p.accounts.filter(u => u.id !== acc.id)}));
                                   setHasChanges(true);
                                }} className="text-slate-200 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"><Trash2 size={18}/></button>
                             </td>
                          </tr>
                       ))}
                       {(!localRules.accounts || localRules.accounts.length === 0) && (
                          <tr><td colSpan={6} className="py-20 text-center text-[11px] font-black uppercase text-slate-300 tracking-[0.3em] italic">No hay miembros registrados en el staff</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
      )}

      {/* --- PESTAÑA SALAS --- */}
      {activeTab === 'rooms' && (
        <div className="space-y-10 animate-in fade-in">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-3"><Building2 size={24} className="text-indigo-600" /> Control de Salas de Transmisión</h3>
              <button onClick={handleAddRoom} className="bg-slate-900 text-amber-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                 <Plus size={18} /> Nueva Sala
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {localRooms.map(room => (
               <div key={room.id} className={`bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col gap-6 group transition-all relative ${room.isMonitorRoom || room.isCleaningRoom ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-slate-100 hover:shadow-xl hover:scale-[1.02]'}`}>
                 
                 <button onClick={() => handleDeleteRoom(room.id)} className="absolute top-6 right-6 p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                 </button>

                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${room.isMonitorRoom || room.isCleaningRoom ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                       {room.id}
                    </div>
                    <div className="flex-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Nombre de la Sala</label>
                      <input 
                        value={room.name} 
                        onChange={(e) => { setLocalRooms(p => p.map(r => r.id === room.id ? {...r, name: e.target.value} : r)); setHasChanges(true); }} 
                        className="font-black text-slate-800 text-lg outline-none bg-transparent w-full" 
                        placeholder="Nombre de la sala..."
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><IdCard size={10} /> Cédula de la Modelo</label>
                       <input 
                         value={room.billing?.modelCedula || ''} 
                         onChange={(e) => updateRoomBillingField(room.id, 'modelCedula', e.target.value)}
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100" 
                         placeholder="Ingresar cédula..."
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><CreditCard size={10} /> Cuenta Bancaria / Pago</label>
                       <input 
                         value={room.billing?.bankAccount || ''} 
                         onChange={(e) => updateRoomBillingField(room.id, 'bankAccount', e.target.value)}
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100" 
                         placeholder="Banco / Nro Cuenta..."
                       />
                    </div>
                 </div>

                 {(room.isMonitorRoom || room.isCleaningRoom) && (
                    <div className="pt-4 border-t border-indigo-100">
                       <button 
                         onClick={() => setSelectedMonitorRoomId(selectedMonitorRoomId === room.id ? null : room.id)}
                         className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest ${selectedMonitorRoomId === room.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                       >
                          <ListChecks size={16} /> {selectedMonitorRoomId === room.id ? 'Cerrar Planilla' : 'Gestionar Planilla de Turnos'}
                       </button>
                    </div>
                 )}

                 {(room.isMonitorRoom || room.isCleaningRoom) && selectedMonitorRoomId === room.id && (
                    <div className="pt-4 border-t border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Edición de Turnos Semanales</h4>
                       <div className="space-y-3">
                          {(room.monitorShifts || []).map(shift => (
                             <div key={shift.id} className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black uppercase text-slate-400 ml-1">{shift.day}</label>
                                   <select 
                                     value={shift.shiftType}
                                     onChange={(e) => updateMonitorShiftAdmin(room.id, shift.id, 'shiftType', e.target.value)}
                                     className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-[9px] font-black uppercase outline-none"
                                   >
                                      <option value="Mañana (6am-2pm)">Mañana</option>
                                      <option value="Tarde (2pm-10pm)">Tarde</option>
                                      <option value="Noche (10pm-6am)">Noche</option>
                                      <option value="Descanso">Descanso</option>
                                   </select>
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Personal</label>
                                   <input 
                                     type="text" 
                                     value={shift.monitorName}
                                     onChange={(e) => updateMonitorShiftAdmin(room.id, shift.id, 'monitorName', e.target.value)}
                                     placeholder="..."
                                     className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-[9px] font-bold outline-none"
                                   />
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- PESTAÑA INVENTARIO SEX SHOP --- */}
      {activeTab === 'sexshop_inventory' && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
           {/* Resumen Financiero Sex Shop */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-pink-600 to-rose-800 p-8 rounded-[3rem] shadow-xl text-white flex items-center justify-between overflow-hidden relative group">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Vendido Sex Shop (COP)</p>
                   <h4 className="text-4xl font-black tracking-tighter">${sexShopFinance.totalSalesValue.toLocaleString()}</h4>
                   <p className="text-[10px] font-bold mt-2 opacity-40">Dinero acumulado en ventas globales</p>
                </div>
                <ShoppingBag className="w-24 h-24 text-white opacity-10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-500" />
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-700 p-8 rounded-[3rem] shadow-xl text-white flex items-center justify-between overflow-hidden relative group">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Valor Stock en Bodega</p>
                   <h4 className="text-4xl font-black tracking-tighter">${sexShopFinance.totalStockValue.toLocaleString()}</h4>
                   <p className="text-[10px] font-bold mt-2 opacity-40">Valorización de mercancía disponible</p>
                </div>
                <Landmark className="w-24 h-24 text-white opacity-10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-500" />
              </div>
           </div>

           {/* Formulario Rápido Sex Shop */}
           {showAddForm && (
             <div className="bg-white p-8 rounded-[3rem] border-2 border-pink-500 shadow-xl space-y-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center"><h4 className="text-xs font-black uppercase text-pink-600">Crear Nuevo Producto Sex Shop</h4><button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Código</label><input value={newProduct.code} onChange={e => setNewProduct({...newProduct, code: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-pink-500" placeholder="SX-000" /></div>
                   <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Nombre</label><input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-pink-500" placeholder="Vibrador..." /></div>
                   <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Precio COP</label><input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)||0})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-pink-500" /></div>
                </div>
                <button onClick={() => addCatalogItem('sexshop')} className="w-full bg-pink-600 text-white p-4 rounded-2xl font-black uppercase text-xs hover:bg-pink-700 transition-all">Guardar e Incorporar al Inventario</button>
             </div>
           )}

           {/* Tabla de Inventario Sex Shop */}
           <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-3">
                    <ShoppingBag size={20} className="text-pink-500" />
                    Inventario Central de Sex Shop
                 </h3>
                 <div className="flex items-center gap-4">
                    {!showAddForm && <button onClick={() => setShowAddForm(true)} className="bg-pink-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><PlusCircle size={16} /> Nuevo Producto</button>}
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none w-64" />
                    </div>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50">
                       <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="py-6 px-10">Código</th>
                          <th className="py-6 px-10">Producto</th>
                          <th className="py-6 px-10 text-center">Valor Unitario</th>
                          <th className="py-6 px-10 text-center text-indigo-600 bg-indigo-50/20">Entradas</th>
                          <th className="py-6 px-10 text-center text-rose-600 bg-rose-50/20">Salidas</th>
                          <th className="py-6 px-10 text-center bg-emerald-50 text-emerald-600 font-black">Stock</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {(localRules.sexShopCatalog || []).filter(p => (p.name + (p.code || '')).toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                          const nameKey = product.name.toLowerCase().trim();
                          const vendidos = globalSexShopSalesMap[nameKey] || 0;
                          const disponible = (product.initialStock || 0) - vendidos;
                          return (
                             <tr key={product.id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="py-5 px-10 font-mono text-[11px] font-black text-slate-400">{product.code || 'S/C'}</td>
                                <td className="py-5 px-10"><span className="font-black text-slate-700 text-sm">{product.name}</span></td>
                                <td className="py-5 px-10 text-center font-bold text-slate-400 text-xs">${product.unitPrice.toLocaleString()}</td>
                                <td className="py-5 px-10 text-center bg-indigo-50/5">
                                   <input 
                                      type="number" 
                                      min="0"
                                      value={product.initialStock || 0}
                                      onChange={(e) => updateItem('sexshop', product.id, 'initialStock', Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-sm font-black text-indigo-600 outline-none"
                                   />
                                </td>
                                <td className="py-5 px-10 text-center bg-rose-50/5">
                                   <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-600 uppercase">
                                      {vendidos} Unds
                                   </span>
                                </td>
                                <td className={`py-5 px-10 text-center font-black text-base bg-emerald-50/20 ${disponible <= 3 ? 'text-red-500' : 'text-emerald-600'}`}>
                                   {disponible}
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
      )}

      {/* --- PESTAÑA INVENTARIO DULCERÍA --- */}
      {activeTab === 'inventory' && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[3rem] shadow-xl text-white flex items-center justify-between overflow-hidden relative group">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Valor de Ventas Dulcería</p>
                   <h4 className="text-4xl font-black tracking-tighter">${inventoryFinance.totalSalesValue.toLocaleString()}</h4>
                   <p className="text-[10px] font-bold mt-2 opacity-40">Capital recuperado de las salas</p>
                </div>
                <Wallet className="w-24 h-24 text-white opacity-10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-500" />
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-[3rem] shadow-xl text-white flex items-center justify-between overflow-hidden relative group">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Total Valor Stock Dulcería</p>
                   <h4 className="text-4xl font-black tracking-tighter">${inventoryFinance.totalStockValue.toLocaleString()}</h4>
                   <p className="text-[10px] font-bold mt-2 opacity-40">Valorización actual de bodega</p>
                </div>
                <Landmark className="w-24 h-24 text-white opacity-10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-500" />
              </div>
           </div>

           {/* Formulario Rápido Dulcería */}
           {showAddForm && (
             <div className="bg-white p-8 rounded-[3rem] border-2 border-indigo-500 shadow-xl space-y-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center"><h4 className="text-xs font-black uppercase text-indigo-600">Añadir Nuevo Artículo a Dulcería</h4><button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Nombre del Producto</label><input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-500" placeholder="Ej: Red Bull..." /></div>
                   <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Precio Venta COP</label><input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)||0})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-500" /></div>
                </div>
                <button onClick={() => addCatalogItem('snack')} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase text-xs hover:bg-indigo-700 transition-all">Incorporar Producto al Catálogo de Dulcería</button>
             </div>
           )}

           <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-3"><Utensils size={20} className="text-indigo-500" /> Control de Stock Dulcería</h3>
                 <div className="flex items-center gap-4">
                    {!showAddForm && <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><PlusCircle size={16} /> Nuevo Producto</button>}
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
                    </div>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/80">
                       <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="py-6 px-10">Producto</th>
                          <th className="py-6 px-10 text-center">Entradas</th>
                          <th className="py-6 px-10 text-center">Salidas</th>
                          <th className="py-6 px-10 text-center bg-emerald-50 text-emerald-600 font-black">Disponible</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {(localRules.snackCatalog || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                          const vendidos = globalSalesMap[product.id] || 0;
                          const disponible = (product.initialStock || 0) - vendidos;
                          return (
                             <tr key={product.id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="py-5 px-10"><span className="font-black text-slate-700 text-sm">{product.name}</span></td>
                                <td className="py-5 px-10 text-center">
                                   <input type="number" min="0" value={product.initialStock || 0} onChange={(e) => updateItem('snack', product.id, 'initialStock', parseInt(e.target.value) || 0)} className="w-20 border border-slate-200 rounded-xl px-2 py-2 text-center text-sm font-black text-indigo-600 outline-none" />
                                </td>
                                <td className="py-5 px-10 text-center font-black text-pink-500">{vendidos}</td>
                                <td className={`py-5 px-10 text-center font-black text-base bg-emerald-50/10 ${disponible <= 5 ? 'text-red-500' : 'text-emerald-600'}`}>{disponible}</td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
      )}

      {/* --- PESTAÑA CATÁLOGOS --- */}
      {activeTab === 'catalog' && (
        <div className="space-y-10 animate-in fade-in">
           <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl">
              <h3 className="text-[11px] font-black uppercase text-pink-500 mb-8 flex items-center gap-3"><Tag size={20} /> Gestión de Catálogos Maestros</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Código</label>
                    <div className="relative">
                       <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                       <input type="text" value={newProduct.code} onChange={(e) => setNewProduct({...newProduct, code: e.target.value})} placeholder="SX-001" className="w-full bg-slate-800 border-none rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Nombre</label>
                    <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="Nombre..." className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-pink-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-2 tracking-widest">Precio COP</label>
                    <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: parseInt(e.target.value)||0})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-pink-500" />
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => addCatalogItem('snack')} className="flex-1 bg-indigo-600 p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-indigo-700 transition-all">Añadir Dulcería</button>
                    <button onClick={() => addCatalogItem('sexshop')} className="flex-1 bg-pink-600 p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-pink-700 transition-all">Añadir SexShop</button>
                 </div>
              </div>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">Items Dulcería</h4>
                 <div className="bg-white p-6 rounded-[3rem] border border-slate-200 space-y-4 max-h-[500px] overflow-y-auto">
                    {(localRules.snackCatalog || []).map(prod => (
                      <div key={prod.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group">
                        <div><p className="font-black text-slate-800 text-xs">{prod.name}</p><p className="text-[10px] font-bold text-slate-400">${prod.unitPrice.toLocaleString()}</p></div>
                        <button onClick={() => setLocalRules(p => ({...p, snackCatalog: (p.snackCatalog || []).filter(x => x.id !== prod.id)}))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">Items Sex Shop</h4>
                 <div className="bg-white p-6 rounded-[3rem] border border-slate-200 space-y-4 max-h-[500px] overflow-y-auto">
                    {(localRules.sexShopCatalog || []).map(prod => (
                      <div key={prod.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group">
                        <div><p className="font-black text-slate-800 text-xs">{prod.name}</p><p className="text-[10px] font-bold text-slate-400">{prod.code || 'S/C'} - ${prod.unitPrice.toLocaleString()}</p></div>
                        <button onClick={() => setLocalRules(p => ({...p, sexShopCatalog: (p.sexShopCatalog || []).filter(x => x.id !== prod.id)}))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- PESTAÑA GENERAL (RESTAURADA CON NUEVA LÓGICA DE INGRESOS) --- */}
      {activeTab === 'general' && (
        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
           {/* TRM Y CONFIGURACIÓN BÁSICA */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 flex flex-col justify-center">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><Coins size={28} /></div>
                    <div>
                       <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Tasa de Cambio (TRM)</h4>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Precio del Dólar Hoy</p>
                    </div>
                 </div>
                 <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <input type="number" value={localRules.usdExchangeRate} onChange={(e) => updateGlobalSetting('usdExchangeRate', parseInt(e.target.value) || 0)} className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all" />
                 </div>
              </div>

              <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white flex flex-col justify-center relative overflow-hidden group">
                 <div className="relative z-10 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Gastos (Egresos)</p>
                    <h4 className="text-4xl font-black tracking-tighter">${(localRules.expenses || []).reduce((s, e) => s + e.amount, 0).toLocaleString()}</h4>
                    <p className="text-[9px] font-bold mt-2 opacity-40 uppercase tracking-widest italic">Acumulado histórico en sistema</p>
                 </div>
                 <TrendingDown className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 text-white flex flex-col justify-center relative overflow-hidden group">
                 <div className="relative z-10 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-emerald-400">Total Ingresos (Recibido + Multas)</p>
                    <h4 className="text-4xl font-black tracking-tighter text-emerald-500">${((localRules.incomeRecords || []).reduce((s, i) => s + i.totalCop, 0) + totalModelPenalties).toLocaleString()}</h4>
                    <p className="text-[9px] font-bold mt-2 opacity-40 uppercase tracking-widest italic text-slate-400">Fondos reales disponibles en COP</p>
                 </div>
                 <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
              </div>
           </div>

           {/* REGISTRO DE GASTOS */}
           <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3"><Receipt size={18} /> Registro de Egresos de Caja</h3>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Descripción del Gasto</label>
                       <input value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Ej. Pago Servicios..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Monto COP</label>
                       <input type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Categoría</label>
                       <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100">
                          <option>Operativo</option>
                          <option>Mantenimiento</option>
                          <option>Marketing</option>
                          <option>Suministros</option>
                          <option>Otros</option>
                       </select>
                    </div>
                    <button onClick={handleAddExpense} className="bg-slate-900 text-amber-400 p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"><Plus size={18} /> Registrar Gasto</button>
                 </div>
                 <div className="overflow-x-auto rounded-[2rem] border border-slate-50">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50"><tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-100"><th className="p-5">Fecha</th><th className="p-5">Descripción</th><th className="p-5">Categoría</th><th className="p-5 text-right">Monto COP</th><th className="p-5 text-center">Gestión</th></tr></thead>
                       <tbody className="divide-y divide-slate-50">
                          {(localRules.expenses || []).map(exp => (
                             <tr key={exp.id} className="text-[10px] font-bold text-slate-600 hover:bg-slate-50/50">
                                <td className="p-5 font-mono text-slate-400">{exp.date}</td>
                                <td className="p-5 text-slate-800 uppercase">{exp.description}</td>
                                <td className="p-5 uppercase"><span className="px-3 py-1 bg-slate-100 rounded-full text-[8px] font-black">{exp.category || 'N/A'}</span></td>
                                <td className="p-5 text-right font-black text-rose-500">${exp.amount.toLocaleString()}</td>
                                <td className="p-5 text-center"><button onClick={() => {setLocalRules(p => ({...p, expenses: (p.expenses || []).filter(e => e.id !== exp.id)})); setHasChanges(true);}} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           {/* REGISTRO DE INGRESOS (LIQUIDACIÓN DE PAGOS) */}
           <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600 flex items-center gap-3"><Briefcase size={18} /> Liquidación de Pagos (Plataformas & Multas)</h3>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Plataforma</label>
                       <select value={newIncome.platform} onChange={e => setNewIncome({...newIncome, platform: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-100">
                          <option>Chaturbate</option><option>Stripchat</option><option>CamSoda</option><option>BongaCams</option><option>Flirt4Free</option><option>Otros</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Monto USD Enviado</label>
                       <input type="number" step="0.01" value={newIncome.amountUsdPaid} onChange={e => setNewIncome({...newIncome, amountUsdPaid: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Monto USD Recibido (Real)</label>
                       <input type="number" step="0.01" value={newIncome.amountUsdReceived} onChange={e => setNewIncome({...newIncome, amountUsdReceived: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-100" />
                    </div>
                    <button onClick={handleAddIncome} className="bg-emerald-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"><Plus size={18} /> Registrar Ingreso</button>
                 </div>
                 
                 <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/80"><tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-100"><th className="p-5">Fecha / Tipo</th><th className="p-5">Plataforma / Fuente</th><th className="p-5 text-center">USD Enviado</th><th className="p-5 text-center">USD Recibido</th><th className="p-5 text-center text-red-500">Pérdida (USD/COP)</th><th className="p-5 text-right font-black">Total COP Neto</th><th className="p-5 text-center">Gestión</th></tr></thead>
                       <tbody className="divide-y divide-slate-50">
                          {/* Entrada automática de Multas */}
                          <tr className="bg-amber-50/30 text-[10px] font-bold text-amber-800">
                             <td className="p-5 italic">Sincronizado</td>
                             <td className="p-5 uppercase font-black flex items-center gap-2"><AlertCircle size={14} className="text-amber-500" /> Sumatoria de Multas (Modelos)</td>
                             <td className="p-5 text-center">-</td>
                             <td className="p-5 text-center text-amber-600 font-black">${(totalModelPenalties / localRules.usdExchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} USD*</td>
                             <td className="p-5 text-center">-</td>
                             <td className="p-5 text-right font-black text-amber-900">${totalModelPenalties.toLocaleString()}</td>
                             <td className="p-5 text-center"><span className="text-[8px] opacity-40">AUTOMÁTICO</span></td>
                          </tr>

                          {/* Registros de Plataformas */}
                          {(localRules.incomeRecords || []).map(inc => {
                             const usdLost = (inc.amountUsdPaid || 0) - (inc.amountUsdReceived || 0);
                             const copLost = usdLost * inc.exchangeRate;
                             return (
                                <tr key={inc.id} className="text-[10px] font-bold text-slate-600 hover:bg-slate-50/50">
                                   <td className="p-5 font-mono text-slate-400">{inc.date}</td>
                                   <td className="p-5 text-slate-800 uppercase font-black">{inc.platform}</td>
                                   <td className="p-5 text-center text-slate-400">${inc.amountUsdPaid.toLocaleString()} USD</td>
                                   <td className="p-5 text-center text-emerald-600 font-black">${inc.amountUsdReceived.toLocaleString()} USD</td>
                                   <td className="p-5 text-center">
                                      <div className="flex flex-col">
                                         <span className="text-red-500 font-black">-${usdLost.toLocaleString(undefined, {maximumFractionDigits: 2})} USD</span>
                                         <span className="text-[8px] text-red-300">-${copLost.toLocaleString()} COP</span>
                                      </div>
                                   </td>
                                   <td className="p-5 text-right font-black text-slate-900 bg-slate-50/30">${inc.totalCop.toLocaleString()}</td>
                                   <td className="p-5 text-center"><button onClick={() => {setLocalRules(p => ({...p, incomeRecords: (p.incomeRecords || []).filter(i => i.id !== inc.id)})); setHasChanges(true);}} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
                                </tr>
                             );
                          })}
                       </tbody>
                       {((localRules.incomeRecords || []).length === 0 && totalModelPenalties === 0) && (
                          <tfoot><tr><td colSpan={7} className="py-10 text-center text-[10px] font-black uppercase text-slate-300 italic tracking-[0.2em]">No hay registros financieros en este periodo</td></tr></tfoot>
                       )}
                    </table>
                 </div>
              </div>
           </div>

           {/* AUDITORÍA GENERAL DE SALAS */}
           <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3"><AlertCircle size={18} /> Auditoría Detallada por Sala (Rendimiento & Finanzas)</h3>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                    <table className="w-full text-left">
                       <thead className="bg-slate-950 text-white">
                          <tr className="text-[9px] font-black uppercase tracking-widest">
                             <th className="p-5">Sala / ID</th>
                             <th className="p-5">Modelo</th>
                             <th className="p-5 text-center">Tokens</th>
                             <th className="p-5 text-center">Horas</th>
                             <th className="p-5 text-right text-emerald-400">Bruto COP</th>
                             <th className="p-5 text-right text-red-400">Dulcería</th>
                             <th className="p-5 text-right text-red-400">Adelantos</th>
                             <th className="p-5 text-right text-red-400">Sex Shop</th>
                             <th className="p-5 text-right text-red-400">Multas</th>
                             <th className="p-5 text-right bg-emerald-900/40 text-emerald-400">Neto Quincena</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {localRooms.filter(r => !r.isMonitorRoom && !r.isCleaningRoom).map(room => {
                             const model = localRules.accounts.find(a => a.roomId === room.id && a.role === 'model');
                             const totalTokens = (room.logs || []).reduce((s, l) => s + l.platformTokens.reduce((sp, p) => sp + p.tokens, 0), 0);
                             const totalHours = (room.logs || []).reduce((s, l) => s + l.totalHours, 0);
                             const billing = room.billing || { modelPercentage: 60, tokenValueUsd: 0.05, absencesCount: 0 };
                             
                             const grossCop = (totalTokens * (billing.modelPercentage / 100)) * (billing.tokenValueUsd || 0.05) * localRules.usdExchangeRate;
                             
                             const dulceria = (room.snackConsumptions || []).reduce((s, c) => {
                                const p = localRules.snackCatalog.find(x => x.id === c.productId);
                                return s + (c.quantity * (p?.unitPrice || 0));
                             }, 0);
                             const advances = (room.advances || []).reduce((s, a) => s + a.amount, 0);
                             const sexshop = (room.sexShopItems || []).reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
                             const penalty = (billing.absencesCount || 0) * 20 * localRules.usdExchangeRate;
                             
                             const net = grossCop - (dulceria + advances + sexshop + penalty);

                             return (
                                <tr key={room.id} className="text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                   <td className="p-5">
                                      <div className="flex flex-col">
                                         <span className="text-slate-900 font-black uppercase">{room.name}</span>
                                         <span className="text-[8px] text-slate-400">ID: {room.id}</span>
                                      </div>
                                   </td>
                                   <td className="p-5 uppercase text-indigo-600 truncate max-w-[120px]">{model?.name || 'S/A'}</td>
                                   <td className="p-5 text-center">{totalTokens.toLocaleString()}</td>
                                   <td className="p-5 text-center">{totalHours.toFixed(1)}h</td>
                                   <td className="p-5 text-right font-black text-slate-900">${grossCop.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                   <td className="p-5 text-right font-black text-red-500">-${dulceria.toLocaleString()}</td>
                                   <td className="p-5 text-right font-black text-red-500">-${advances.toLocaleString()}</td>
                                   <td className="p-5 text-right font-black text-red-500">-${sexshop.toLocaleString()}</td>
                                   <td className="p-5 text-right font-black text-red-500">-${penalty.toLocaleString()}</td>
                                   <td className="p-5 text-right font-black text-emerald-600 bg-emerald-50/20">${net.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           {/* MATRIZ DE PERMISOS */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-inner"><ShieldCheck size={32} /></div>
                <div>
                   <h3 className="text-xl font-black text-slate-800">Matriz de Seguridad & Privilegios</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Configuración centralizada de accesos</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-4">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-amber-700 bg-white px-3 py-1 rounded-full">Administrador Elite</span><CheckCircle2 size={18} className="text-amber-500" /></div>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-600"><CheckCircle2 size={12} className="text-emerald-500" /> Control total de salas y staff</li>
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-600"><CheckCircle2 size={12} className="text-emerald-500" /> Gestión de Finanzas Globales</li>
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-600"><CheckCircle2 size={12} className="text-emerald-500" /> Auditoría de Inventarios</li>
                    </ul>
                 </div>
                 <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-indigo-700 bg-white px-3 py-1 rounded-full">Monitora Master</span><Settings2 size={18} className="text-indigo-500" /></div>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-600"><CheckCircle2 size={12} className="text-emerald-500" /> Planilla de Tokens y Asistencia</li>
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-600"><CheckCircle2 size={12} className="text-emerald-500" /> Consumos Dulcería y Vitrina</li>
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-400 line-through"><X size={12} className="text-red-500" /> Acceso Financiero Bloqueado</li>
                    </ul>
                 </div>
                 <div className="p-6 bg-pink-50 rounded-[2rem] border border-pink-100 space-y-4">
                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-pink-700 bg-white px-3 py-1 rounded-full">Modelo Estrella</span><Eye size={18} className="text-pink-500" /></div>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-600"><CheckCircle2 size={12} className="text-emerald-500" /> Visualización de Producción</li>
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-600"><CheckCircle2 size={12} className="text-emerald-500" /> Firma de Liquidaciones</li>
                       <li className="flex items-center gap-2 text-[10px] font-black text-slate-400 italic"><Lock size={12} /> Restricción Total de Edición</li>
                    </ul>
                 </div>
              </div>
           </div>
        </section>
      )}
    </div>
  );
};

export default StudioRules;
