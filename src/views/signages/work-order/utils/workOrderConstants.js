// ==============================|| WORK ORDER - CONSTANTS ||============================== //

/**
 * Status types for work orders
 */
export const WORK_ORDER_STATUS = {
  WAIT_TECH: 'WT',
  WAIT_PART: 'WP',
  IN_SERVICE: 'WS',
  DONE: 'DONE'
};

/**
 * Status display names
 */
export const STATUS_LABELS = {
  WT: 'Wait Technician',
  WP: 'Wait Part',
  WS: 'In Service',
  DONE: 'Completed'
};

/**
 * Priority levels
 */
export const PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

/**
 * Column gradient backgrounds
 */
export const COLUMN_GRADIENTS = {
  WT: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',    // Blue
  WP: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',    // Amber
  WS: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',    // Emerald
  DONE: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'   // Indigo
};

/**
 * Status color configurations
 */
export const STATUS_COLORS = {
  WT: {
    primary: '#3B82F6',
    light: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
    gradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)'
  },
  WP: {
    primary: '#F59E0B',
    light: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
  },
  WS: {
    primary: '#10B981',
    light: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
  },
  DONE: {
    primary: '#6366F1',
    light: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.3)',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
  }
};

/**
 * Priority color configurations
 */
export const PRIORITY_COLORS = {
  CRITICAL: {
    primary: '#EF4444',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '#EF4444',
    icon: '⚠️'
  },
  HIGH: {
    primary: '#F97316',
    background: 'rgba(249, 115, 22, 0.15)',
    border: '#F97316',
    icon: '🔴'
  },
  MEDIUM: {
    primary: '#EAB308',
    background: 'rgba(234, 179, 8, 0.15)',
    border: '#EAB308',
    icon: '🟡'
  },
  LOW: {
    primary: '#22C55E',
    background: 'rgba(34, 197, 94, 0.15)',
    border: '#22C55E',
    icon: '🟢'
  }
};

/**
 * Duration thresholds (in hours)
 */
export const DURATION_THRESHOLDS = {
  CRITICAL: 8,     // Red after 8 hours
  WARNING: 4,      // Orange after 4 hours
  NORMAL: 2        // Yellow after 2 hours
};

/**
 * Animation configurations
 */
export const ANIMATIONS = {
  SPRING_CONFIG: {
    tension: 300,
    friction: 20
  },
  PULSE_DURATION: 2000,
  HOVER_TRANSFORM: 'perspective(1000px) rotateX(5deg) rotateY(5deg) scale(1.02)',
  NORMAL_TRANSFORM: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
};

/**
 * Card dimensions
 */
export const CARD_DIMENSIONS = {
  WIDTH: 320,
  MIN_HEIGHT: 280,
  MAX_HEIGHT: 380,
  BORDER_RADIUS: 16
};

/**
 * API parameter defaults
 */
export const API_DEFAULTS = {
  CABANG_ID: 2,
  CTG: 'HE',
  PAGE: 1,
  PER_PAGE: 12,
  REFRESH_INTERVAL: 180000, // 3 minutes (180000 ms)
  PAGINATION_INTERVAL: 60000 // 1 minute (60000 ms)
};

/**
 * Column order for display
 */
export const COLUMN_ORDER = ['WT', 'WP', 'WS'];

/**
 * Category options
 */
export const CATEGORY_OPTIONS = [
  { value: 'HE', label: 'Heavy Equipment' },
  { value: 'DT', label: 'Dump Truck' }
];

/**
 * Glassmorphism card styles
 */
export const GLASSMORPHISM_STYLES = {
  light: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
  },
  dark: {
    background: 'rgba(30, 30, 30, 0.95)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
  }
};
