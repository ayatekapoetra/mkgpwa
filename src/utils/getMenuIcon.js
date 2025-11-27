// Icon imports from iconsax-react
import {
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
  DocumentText,
  MaximizeCircle,
  CardCoin,
  Radar2,
  Setting2,
  PresentionChart
} from 'iconsax-react';

// Icon mapping object
const iconMap = {
  home: Home2,
  home2: Home2,
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
  'pickup-order': ReceiptItem,
  'shipping-order': Ship,
  'penugasan-kerja': ClipboardText,
  'user-access': ShieldTick,
};

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
  const IconComponent = iconMap[key];
  
  if (!IconComponent) {
    console.warn(`[getMenuIcon] Icon not found for: "${iconName}" (key: "${key}")`);
  }
  
  return IconComponent || null;
}

export default getMenuIcon;
