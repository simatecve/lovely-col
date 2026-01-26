
import { AppData, AttendanceStatus, StudioRules, StudioUser, GlobalProduct } from './types';

const BASE_NAMES = ['Tokio', 'Rumania', 'Colombia', 'Berlin', 'Polonia', 'Francia', 'Alemania', 'Argentina', 'Manizales', 'Brasil'];
const SHIFTS = ['Mañana', 'Tarde', 'Noche'];
const DEFAULT_PLATFORMS = ['Chaturbate', 'Stripchat', 'CamSoda', 'BongaCams', 'Amateur TV'];

const INITIAL_SNACK_CATALOG: GlobalProduct[] = [
  { id: 's1', name: 'Vive 100', unitPrice: 3300, initialStock: 0 },
  { id: 's2', name: 'Coca Cola x 400', unitPrice: 3300, initialStock: 0 },
  { id: 's3', name: 'Pony Personal', unitPrice: 3300, initialStock: 0 },
  { id: 's4', name: 'Glacial x 400', unitPrice: 1800, initialStock: 0 },
  { id: 's5', name: 'Hit x 500', unitPrice: 3000, initialStock: 0 },
  { id: 's6', name: 'Nucita', unitPrice: 1000, initialStock: 0 },
  { id: 's7', name: 'Bom Bom Bun', unitPrice: 800, initialStock: 0 },
  { id: 's8', name: 'Leche Personal', unitPrice: 1600, initialStock: 0 },
  { id: 's9', name: 'Trident Mediano', unitPrice: 2000, initialStock: 0 },
  { id: 's10', name: 'Festibal Grande', unitPrice: 1800, initialStock: 0 },
  { id: 's11', name: 'Chocolatina Yet', unitPrice: 1700, initialStock: 0 },
  { id: 's12', name: 'Pañitos Humedos', unitPrice: 2000, initialStock: 0 },
  { id: 's13', name: 'Gatorade', unitPrice: 4200, initialStock: 0 },
  { id: 's14', name: 'Agua Cristal Mini', unitPrice: 1000, initialStock: 0 },
  { id: 's15', name: 'Mani Moto', unitPrice: 2000, initialStock: 0 },
  { id: 's16', name: 'Productos Papis', unitPrice: 2000, initialStock: 0 },
  { id: 's17', name: 'Papas Margarita', unitPrice: 2500, initialStock: 0 },
  { id: 's18', name: 'Gomas', unitPrice: 2500, initialStock: 0 },
  { id: 's19', name: 'Chestres', unitPrice: 2000, initialStock: 0 },
  { id: 's20', name: 'Doritos', unitPrice: 2800, initialStock: 0 },
  { id: 's21', name: 'Boliquesos', unitPrice: 2000, initialStock: 0 },
  { id: 's22', name: 'DeTodito', unitPrice: 3000, initialStock: 0 },
  { id: 's23', name: 'Chokis Galleta', unitPrice: 3000, initialStock: 0 },
  { id: 's24', name: 'Chocolores', unitPrice: 2200, initialStock: 0 },
  { id: 's25', name: 'Choclitos', unitPrice: 2000, initialStock: 0 },
  { id: 's26', name: 'Chocolatina Bianchi', unitPrice: 1600, initialStock: 0 },
  { id: 's27', name: 'Trident Pequeño', unitPrice: 500, initialStock: 0 },
  { id: 's28', name: 'Barquillo Piazza', unitPrice: 1000, initialStock: 0 },
  { id: 's29', name: 'Arequipe', unitPrice: 2200, initialStock: 0 },
  { id: 's30', name: 'Trocipollo', unitPrice: 2000, initialStock: 0 },
  { id: 's31', name: 'Agua Grande', unitPrice: 2000, initialStock: 0 },
  { id: 's32', name: 'Burbuja Yet', unitPrice: 2000, initialStock: 0 },
  { id: 's33', name: 'Chocolates Gol', unitPrice: 2000, initialStock: 0 },
  { id: 's34', name: 'Saviloe', unitPrice: 3000, initialStock: 0 },
  { id: 's35', name: 'Avena', unitPrice: 2500, initialStock: 0 },
  { id: 's36', name: 'Leche Saborizada', unitPrice: 2500, initialStock: 0 },
  { id: 's37', name: 'Vaso Yogurt', unitPrice: 2000, initialStock: 0 },
  { id: 's38', name: 'Cereales', unitPrice: 4500, initialStock: 0 },
  { id: 's39', name: 'Rosquilas', unitPrice: 1500, initialStock: 0 },
  { id: 's40', name: 'Lecheritas', unitPrice: 1600, initialStock: 0 },
  { id: 's41', name: 'Chocolatina Bianchi XL', unitPrice: 2000, initialStock: 0 }
];

const createInitialData = (): AppData => {
  const rooms: any[] = [];
  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  const accounts: StudioUser[] = [
    { id: 'admin-1', username: 'andresb', password: '3113', role: 'admin', name: 'Andrés B.' },
    { id: 'admin-2', username: 'andresv', password: '0130', role: 'admin', name: 'Andrés V.' },
    { id: 'mgr-1', username: 'monica', password: '123', role: 'manager', name: 'Monica' },
    { id: 'mgr-2', username: 'daniela', password: '123', role: 'manager', name: 'Daniela' },
    { id: 'mgr-3', username: 'camila', password: '123', role: 'manager', name: 'Camila' }
  ];

  for (let i = 0; i < 30; i++) {
    const shiftIndex = Math.floor(i / 10);
    const shift = SHIFTS[shiftIndex] || 'Noche';
    const nameIndex = i % BASE_NAMES.length;
    const cityName = BASE_NAMES[nameIndex];
    const roomName = `${cityName} ${shift}`;
    const roomId = i + 1;

    rooms.push({
      id: roomId,
      name: roomName,
      platforms: [...DEFAULT_PLATFORMS],
      commissionRate: 0.5,
      logs: [],
      sexShopItems: [],
      sexShopAbonosHistory: [],
      dulceriaQuantities: {},
      advances: []
    });

    const userPrefix = cityName.toLowerCase().replace(/\s/g, '');
    const shiftChar = shift[0].toLowerCase();
    const roomUsername = `${userPrefix}${shiftChar}${roomId}`;
    const roomPassword = `lovely${roomId}`;

    accounts.push({
      id: `model-acc-${roomId}`,
      username: roomUsername,
      password: roomPassword,
      role: 'model',
      name: `Modelo ${roomName}`,
      roomId: roomId
    });
  }

  // --- NUEVAS SALAS DE MONITORES ---
  for (let i = 1; i <= 3; i++) {
    const monitorRoomId = 100 + i;
    rooms.push({
      id: monitorRoomId,
      name: `Gestión Monitoras ${i}`,
      platforms: [],
      commissionRate: 0,
      logs: [],
      sexShopItems: [],
      sexShopAbonosHistory: [],
      dulceriaQuantities: {},
      advances: [],
      isMonitorRoom: true,
      monitorShifts: DAYS.map(day => ({
        id: `shift-${monitorRoomId}-${day}`,
        day: day,
        shiftType: 'Mañana (6am-2pm)',
        monitorName: ''
      }))
    });
  }

  // --- SALA PERSONAL ASEO (JOHANA ASEO - MAÑANA) ---
  const aseoRoomId = 201;
  rooms.push({
    id: aseoRoomId,
    name: 'Johana Aseo',
    platforms: [],
    commissionRate: 0,
    logs: [],
    sexShopItems: [],
    sexShopAbonosHistory: [],
    dulceriaQuantities: {},
    advances: [],
    isCleaningRoom: true,
    monitorShifts: DAYS.map(day => ({
      id: `shift-aseo-am-${day}`,
      day: day,
      shiftType: 'Mañana (6am-2pm)',
      monitorName: 'Johana'
    }))
  });

  return {
    rooms,
    rules: {
      dailyTargetHours: 8,
      weeklyTargetHours: 40,
      usdExchangeRate: 4000,
      platforms: [...DEFAULT_PLATFORMS],
      accounts,
      snackCatalog: INITIAL_SNACK_CATALOG,
      sexShopCatalog: [],
      expenses: [],
      incomeRecords: []
    }
  };
};

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700 border-green-200',
  late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  excused: 'bg-blue-100 text-blue-700 border-blue-200',
  day_off: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const INITIAL_DATA = createInitialData();
