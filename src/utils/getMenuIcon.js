// Icon imports from iconsax-react
import {
  Android,
  Diagram,
  Building,
  Truck,
  TruckFast,
  Box,
  Layer,
  Location,
  Task,
  TaskSquare,
  Profile,
  Profile2User,
  Buildings,
  Buildings2,
  Ship,
  ReceiptItem,
  BoxTime,
  NoteText,
  ClipboardText,
  Shield,
  ShieldTick,
  Book,
  Permission,
  Category,
  Windows,
  Home,
  Home2,
  HomeTrendUp,
  SmartCar,
  DocumentText,
  MaximizeCircle,
  CardCoin,
  Radar2,
  Setting2,
  PresentionChart,
  Avalanche,
  FingerScan,
  Building4,
  Building3,
  ProgrammingArrows,
  FavoriteChart
} from 'iconsax-react';

const normalizeIconKey = (value) =>
  value
    ? value
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
    : '';

// Icon mapping object
const iconMap = {
  home: Home2,
  home2: Home2,
  dashboard: HomeTrendUp,
  diagram: Diagram,
  building: Building,
  buildings: Buildings,
  buildings2: Buildings2,
  truck: Truck,
  truckFast: TruckFast,
  box: Box,
  layer: Layer,
  location: Location,
  task: Task,
  taskSquare: TaskSquare,
  profile: Profile,
  profile2User: Profile2User,
  people: Profile2User,
  ship: Ship,
  receiptItem: ReceiptItem,
  noteText: NoteText,
  clipboardText: ClipboardText,
  shield: Shield,
  shieldTick: ShieldTick,
  permission: ShieldTick,
  book: Book,
  category: Category,
  windows: Windows,
  page: DocumentText,
  documentText: DocumentText,
  maximizeCircle: MaximizeCircle,
  cardCoin: CardCoin,
  radar2: Radar2,
  setting: Setting2,
  setting2: Setting2,
  presentionChart: PresentionChart,
  smartcar: SmartCar,
  avalanche: Avalanche,
  android: Android,
  Building4: Building4,
  Building3: Building3,
  FingerScan: FingerScan,
  ProgrammingArrows: ProgrammingArrows,
  FavoriteChart: FavoriteChart,
  BoxTime: BoxTime,

  // Aliases for common names
  dom: Diagram,
  equipment: Truck,
  barang: Box,
  material: Layer,
  'lokasi-kerja': Location,
  'kegiatan-kerja': Task,
  penyewa: Profile2User,
  cabang: Buildings,
  'delivery-order': TruckFast,
  do: TruckFast,
  'shipping-order': Ship,
  so: BoxTime,
  'penugasan-kerja': ClipboardText,
  'user-access': ShieldTick,
};

const normalizedIconMap = Object.fromEntries(
  Object.entries(iconMap).map(([key, component]) => [normalizeIconKey(key), component])
);

/**
 * Get icon component from icon name string
 * @param {string} iconName - Name of the icon from backend
 * @returns {React.Component|null} - Icon component or null
 */
export function getMenuIcon(iconName) {
  if (!iconName || typeof iconName !== 'string') {
    console.log('[getMenuIcon] Invalid iconName:', iconName);
    return null;
  }
  
  const key = iconName.toLowerCase();
  const normalizedKey = normalizeIconKey(iconName);
  const IconComponent = iconMap[key] || normalizedIconMap[normalizedKey];
  
  if (!IconComponent) {
    console.warn(`[getMenuIcon] Icon not found for: "${iconName}" (key: "${key}")`);
  }
  
  return IconComponent || null;
}

export default getMenuIcon;
