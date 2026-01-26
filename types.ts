
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'day_off';
export type Role = 'admin' | 'manager' | 'model';

export interface StudioUser {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
  roomId?: number;
}

export interface UserSession {
  id: string;
  name: string;
  role: Role;
  username: string;
  roomId?: number;
}

export interface PlatformToken {
  platform: string;
  tokens: number;
}

export interface DailyLog {
  id: string;
  date: string;
  status: AttendanceStatus;
  startTime: string;
  endTime: string;
  totalHours: number;
  platformTokens: PlatformToken[];
  notes?: string;
}

export interface SexShopItem {
  id: string;
  date: string; // Added for period filtering
  code?: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface SexShopAbono {
  id: string;
  date: string;
  amount: number;
}

export interface GlobalProduct {
  id: string;
  code?: string;
  name: string;
  unitPrice: number;
  initialStock?: number;
}

export interface Advance {
  id: string;
  date: string;
  concept: string;
  amount: number;
}

export interface StudioExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
}

export interface IncomeRecord {
  id: string;
  date: string;
  platform: string;
  amountUsdPaid: number;      // Monto enviado por la plataforma
  amountUsdReceived: number;  // Monto recibido real
  exchangeRate: number;
  totalCop: number;
}

export interface RoomBilling {
  periodStart: string;
  periodEnd: string;
  modelCedula: string;
  bankAccount?: string;
  usdExchangeRate: number;
  modelPercentage: number;
  tokenValueUsd: number; 
  paymentMethod?: string;
  absencesCount?: number;
  baseSalary?: number; // Sueldo base para personal de staff
}

export interface MonitorShift {
  id: string;
  day: string; // 'Lunes', 'Martes', etc.
  shiftType: 'Mañana (6am-2pm)' | 'Tarde (2pm-10pm)' | 'Noche (10pm-6am)' | 'Descanso';
  monitorName: string;
}

export interface SnackConsumption {
  id: string;
  date: string;
  productId: string;
  quantity: number;
}

export interface ModelRoom {
  id: number;
  name: string;
  platforms: string[];
  logs: DailyLog[];
  commissionRate: number;
  sexShopItems?: SexShopItem[];
  sexShopAbonosHistory?: SexShopAbono[];
  dulceriaQuantities?: Record<string, number>; // Legacy global counter
  snackConsumptions?: SnackConsumption[]; // Period-aware consumptions
  advances?: Advance[];
  billing?: RoomBilling;
  dailyTargetHours?: number;
  weeklyTargetHours?: number;
  isMonitorRoom?: boolean;
  isCleaningRoom?: boolean;
  monitorShifts?: MonitorShift[];
}

export interface StudioRules {
  dailyTargetHours: number;
  weeklyTargetHours: number;
  usdExchangeRate: number; 
  platforms: string[];
  accounts: StudioUser[];
  snackCatalog: GlobalProduct[]; 
  sexShopCatalog: GlobalProduct[];
  expenses?: StudioExpense[];
  incomeRecords?: IncomeRecord[];
}

export interface AppData {
  rooms: ModelRoom[];
  rules: StudioRules;
}
