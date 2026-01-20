// ==============================|| WORK ORDER - HELPER FUNCTIONS ||============================== //

import moment from 'moment';
import {
  PRIORITY,
  DURATION_THRESHOLDS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  WORK_ORDER_STATUS
} from './workOrderConstants';

/**
 * Format location name for display
 * @param {Object} location - Location object from API
 * @returns {string} Formatted location name
 */
export const formatLocationName = (location) => {
  if (!location) return 'Unassigned';

  // Try different field names
  const nama = location.nama || location.name || location.nama_lokasi || '';
  if (!nama) return 'Unassigned';

  // Remove [code] prefix if exists (e.g., "[PIT-01] Pit 1" -> "Pit 1")
  return nama.replace(/\[.*?\]\s*/, '');
};

/**
 * Get location code from location object
 * @param {Object} location - Location object from API
 * @returns {string} Location code
 */
export const getLocationCode = (location) => {
  if (!location) return '';

  const kode = location.kode || location.code || location.kode_lokasi || '';
  return kode;
};

/**
 * Get full location info with code and name
 * @param {Object} location - Location object from API
 * @returns {string} Formatted location info
 */
export const getLocationInfo = (location) => {
  const code = getLocationCode(location);
  const name = formatLocationName(location);

  if (code && name) {
    return `${code} - ${name}`;
  }
  return name || 'Unassigned';
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Calculate priority based on duration and other factors
 * @param {Object} item - Work order item
 * @returns {string} Priority level
 */
export const calculatePriority = (item) => {
  if (!item) return PRIORITY.LOW;

  // Check if item has duration or created date
  const durationHours = calculateDurationHours(item);

  // Critical: > 8 hours or explicitly marked
  if (durationHours > DURATION_THRESHOLDS.CRITICAL || item?.is_critical) {
    return PRIORITY.CRITICAL;
  }

  // High: > 4 hours or high impact
  if (durationHours > DURATION_THRESHOLDS.WARNING || item?.is_high_priority) {
    return PRIORITY.HIGH;
  }

  // Medium: > 2 hours
  if (durationHours > DURATION_THRESHOLDS.NORMAL) {
    return PRIORITY.MEDIUM;
  }

  return PRIORITY.LOW;
};

/**
 * Calculate duration in hours from created date/timestamp
 * @param {Object} item - Work order item
 * @returns {number} Duration in hours
 */
export const calculateDurationHours = (item) => {
  if (!item) return 0;

  // Try different date fields - breakdown_at, created_at, timestamp, date
  const breakdownAt = item?.breakdown_at || item?.breakdownAt || item?.created_at || item?.timestamp || item?.date;
  if (!breakdownAt) return 0;

  const now = moment();
  let created;

  // Parse date based on format
  // breakdown_at from API comes in format 'DD-MM-YYYY HH:mm'
  if (typeof breakdownAt === 'string' && breakdownAt.match(/^\d{2}-\d{2}-\d{4}/)) {
    created = moment(breakdownAt, 'DD-MM-YYYY HH:mm');
  } else {
    created = moment(breakdownAt);
  }

  // If invalid date, return 0
  if (!created.isValid()) return 0;

  return now.diff(created, 'hours', true);
};

/**
 * Format duration for display
 * @param {Object} item - Work order item
 * @returns {string} Formatted duration (e.g., "2 bulan 5 hari 4 jam 30 menit")
 */
export const formatDuration = (item) => {
  if (!item) return '-';

  const breakdownAt = item?.breakdown_at || item?.breakdownAt || item?.created_at || item?.timestamp || item?.date;
  if (!breakdownAt) return '-';

  const now = moment();
  let start;

  // Parse date based on format
  if (typeof breakdownAt === 'string' && breakdownAt.match(/^\d{2}-\d{2}-\d{4}/)) {
    start = moment(breakdownAt, 'DD-MM-YYYY HH:mm');
  } else {
    start = moment(breakdownAt);
  }

  // If invalid date, return '-'
  if (!start.isValid()) return '-';

  const duration = moment.duration(now.diff(start));
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();

  const parts = [];

  if (months > 0) {
    parts.push(`${months} bulan`);
  }
  if (days > 0) {
    parts.push(`${days} hari`);
  }
  if (hours > 0) {
    parts.push(`${hours} jam`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} menit`);
  }

  return parts.join(' ');
};

/**
 * Get duration color based on threshold
 * @param {Object} item - Work order item
 * @returns {string} Color code
 */
export const getDurationColor = (item) => {
  const hours = calculateDurationHours(item);

  if (hours > DURATION_THRESHOLDS.CRITICAL) return '#EF4444'; // Red
  if (hours > DURATION_THRESHOLDS.WARNING) return '#F97316'; // Orange
  if (hours > DURATION_THRESHOLDS.NORMAL) return '#EAB308'; // Yellow
  return '#22C55E'; // Green
};

/**
 * Transform API data to kanban columns
 * @param {Object} data - API response data (array of units with items)
 * @returns {Object} Kanban columns object
 */
export const transformToKanbanData = (data) => {
  const columns = {
    WT: [],
    WP: [],
    WS: [],
    DONE: []
  };

  console.log('[transformToKanbanData] Input data type:', typeof data, 'Is array:', Array.isArray(data), 'Length:', data?.length);
  console.log('[transformToKanbanData] First item (raw):', data?.[0]);
  console.log('[transformToKanbanData] First item structure:', JSON.stringify(data?.[0], null, 2));

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('[transformToKanbanData] No data to transform');
    return columns;
  }

  // Data structure: array of units, each unit has items[] containing work orders
  let woIndex = 0;
  data.forEach((unit, unitIndex) => {
    console.log(`[transformToKanbanData] Processing unit ${unitIndex}:`, unit.kode_unit, 'Items count:', unit.items?.length);

    // Extract equipment/unit info
    const unitInfo = {
      id: unit.id,
      unitCode: unit.kode_unit || 'N/A',
      unitName: unit.equipment?.nama_unit || unit.nama_unit || 'Unknown Unit',
      manufacturer: unit.equipment?.manufaktur || unit.manufaktur || 'Unknown',
      location: unit.lokasi?.nama ? formatLocationName(unit.lokasi) : (unit.nama_pit || 'Unassigned'),
      breakdownAt: unit.breakdown_at,
      category: unit.equipment?.ctg || unit.ctg || 'HE'
    };

    // Process each work order in items array
    unit.items?.forEach((wo) => {
      const workOrder = {
        id: wo.id || wo.kode_wo || `wo-${woIndex++}`,
        woNumber: wo.kode_wo || 'N/A',
        unitCode: unitInfo.unitCode,
        unitName: unitInfo.unitName,
        manufacturer: unitInfo.manufacturer,
        pitName: unitInfo.location,
        location: unit.lokasi || null,
        locationCode: unit.lokasi?.kode || '',
        problem: wo.problem_issue || wo.problem || wo.descriptions || wo.description || 'No description',
        status: wo.status || WORK_ORDER_STATUS.WAIT_TECH,
        priority: calculatePriority({
          breakdown_at: unitInfo.breakdownAt,
          created_at: unit.created_at,
          timestamp: wo.created_at
        }),
        breakdownAt: unitInfo.breakdownAt || wo.created_at,
        createdAt: wo.created_at,
        updatedAt: wo.updated_at,
        technicians: wo.technicians || [],
        parts: wo.parts || [],
        partsTotal: wo.parts_total || 0,
        partsCompleted: wo.parts_completed || 0,
        category: unitInfo.category,
        // Keep original data reference
        _original: { ...unit, workOrder: wo }
      };

      console.log(`[transformToKanbanData] Work Order ${woIndex}:`, {
        woNumber: workOrder.woNumber,
        unitCode: workOrder.unitCode,
        manufacturer: workOrder.manufacturer,
        pitName: workOrder.pitName,
        problem: workOrder.problem,
        status: workOrder.status
      });

      // Add to appropriate column
      if (columns[workOrder.status]) {
        columns[workOrder.status].push(workOrder);
      } else {
        console.log(`[transformToKanbanData] Unknown status: ${workOrder.status}, adding to WT`);
        columns.WT.push(workOrder);
      }
    });
  });

  console.log('[transformToKanbanData] Result columns:', {
    WT: columns.WT.length,
    WP: columns.WP.length,
    WS: columns.WS.length,
    DONE: columns.DONE.length,
    total: columns.WT.length + columns.WP.length + columns.WS.length + columns.DONE.length
  });

  return columns;
};

/**
 * Calculate column statistics
 * @param {Object} kanbanData - Transformed kanban data
 * @returns {Object} Statistics object
 */
export const calculateColumnStats = (kanbanData) => {
  return {
    total: Object.values(kanbanData).reduce((sum, col) => sum + col.length, 0),
    WT: kanbanData.WT?.length || 0,
    WP: kanbanData.WP?.length || 0,
    WS: kanbanData.WS?.length || 0,
    DONE: kanbanData.DONE?.length || 0
  };
};

/**
 * Get status configuration
 * @param {string} status - Status code
 * @returns {Object} Status configuration
 */
export const getStatusConfig = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.WT;
};

/**
 * Get priority configuration
 * @param {string} priority - Priority level
 * @returns {Object} Priority configuration
 */
export const getPriorityConfig = (priority) => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.LOW;
};

/**
 * Check if duration is critical
 * @param {Object} item - Work order item
 * @returns {boolean} Is critical
 */
export const isDurationCritical = (item) => {
  return calculateDurationHours(item) > DURATION_THRESHOLDS.CRITICAL;
};

/**
 * Generate glassmorphism card styles
 * @param {boolean} isDark - Dark mode
 * @param {string} status - Status code
 * @returns {Object} Style object
 */
export const getGlassmorphismStyles = (isDark, status) => {
  const baseStyles = isDark
    ? {
        background: 'rgba(30, 30, 30, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }
    : {
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
      };

  const statusColor = getStatusConfig(status);

  return {
    ...baseStyles,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderColor: statusColor.border
  };
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Sort work orders by priority and duration
 * @param {Array} workOrders - Array of work orders
 * @returns {Array} Sorted array
 */
export const sortWorkOrders = (workOrders) => {
  if (!Array.isArray(workOrders)) return [];

  const priorityWeight = {
    [PRIORITY.CRITICAL]: 4,
    [PRIORITY.HIGH]: 3,
    [PRIORITY.MEDIUM]: 2,
    [PRIORITY.LOW]: 1
  };

  return [...workOrders].sort((a, b) => {
    // First by priority (critical first)
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by duration (longer first)
    return calculateDurationHours(b) - calculateDurationHours(a);
  });
};

/**
 * Calculate progress percentage
 * @param {number} completed - Completed items
 * @param {number} total - Total items
 * @returns {number} Percentage
 */
export const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
};

/**
 * Format WO number for display
 * @param {string} woNumber - Work order number
 * @returns {string} Formatted WO number
 */
export const formatWONumber = (woNumber) => {
  if (!woNumber) return 'WO-????????';
  return woNumber.toUpperCase();
};

/**
 * Get parts status color
 * @param {number} completed - Completed parts
 * @param {number} total - Total parts
 * @returns {string} Color code
 */
export const getPartsStatusColor = (completed, total) => {
  const progress = calculateProgress(completed, total);

  if (progress === 100) return '#10B981'; // Green
  if (progress >= 50) return '#3B82F6'; // Blue
  if (progress >= 25) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};

/**
 * Animate number count up
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Duration in ms
 * @param {Function} callback - Callback with current value
 */
export const animateCountUp = (start, end, duration, callback) => {
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    callback(Math.round(current));
  }, 16);

  return () => clearInterval(timer);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Safe JSON parse
 * @param {string} json - JSON string
 * @param {*} defaultValue - Default value if parse fails
 * @returns {*} Parsed object or default value
 */
export const safeJsonParse = (json, defaultValue = null) => {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};

/**
 * Check if data is loading
 * @param {boolean} isLoading - Loading state
 * @param {Object} data - Data object
 * @returns {boolean} Is loading
 */
export const isDataLoading = (isLoading, data) => {
  return isLoading || !data;
};
