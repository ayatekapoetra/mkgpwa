const siteMonitoringMock = {
  meta: {
    location: 'Site Konawe Utara',
    reportingDate: '19 Agustus 2026',
    shift: 'Shift 1 · 07:00-19:00',
    refreshMinutes: 3
  },
  production: {
    title: 'Production · Mining / Rental',
    target: 1250000,
    materials: ['Saprolite', 'Limonite', 'OB', 'Quarry'],
    pits: [
      { key: 'pit-a', label: 'Pit A', tone: 'info' },
      { key: 'pit-b', label: 'Pit B', tone: 'primary' },
      { key: 'pit-c', label: 'Pit C', tone: 'warning' }
    ],
    periods: [
      {
        name: 'DAILY',
        unit: 'MT',
        values: [
          [920, 740, 0],
          [640, 520, 0],
          [1350, 980, 260],
          [420, 0, 0]
        ]
      },
      {
        name: 'MTD',
        unit: 'MT',
        values: [
          [18800, 14200, 0],
          [12800, 9500, 0],
          [24700, 18300, 5200],
          [6900, 0, 0]
        ]
      },
      {
        name: 'YTD',
        unit: 'MT',
        values: [
          [245000, 198000, 0],
          [180000, 142000, 0],
          [355000, 279000, 77000],
          [82000, 0, 0]
        ]
      }
    ]
  },
  equipment: {
    availability: 87.4,
    criticalItems: 12,
    cards: [
      {
        title: 'HE Status',
        total: 76,
        unit: 'Unit',
        items: [
          { label: 'Operasi', value: 47, tone: 'success' },
          { label: 'Breakdown', value: 11, tone: 'error' },
          { label: 'Standby', value: 18, tone: 'warning' }
        ]
      },
      {
        title: 'Standby HE Detail',
        total: 0,
        unit: 'Unit',
        items: [
          { label: 'No Opr/Drv', value: 0, tone: 'error' },
          { label: 'No Job', value: 0, tone: 'warning' },
          { label: 'Fuel', value: 0, tone: 'success' },
          { label: 'Hujan', value: 0, tone: 'info' },
          { label: 'Jalan Licin', value: 0, tone: 'primary' },
          { label: 'Public', value: 0, tone: 'primary' },
          { label: 'Arahan', value: 0, tone: 'warning' },
          { label: 'Commissioning', value: 0, tone: 'info' }
        ]
      },
      {
        title: 'Dump Truck Status',
        total: 124,
        unit: 'Unit',
        items: [
          { label: 'Operasi', value: 77, tone: 'success' },
          { label: 'Breakdown', value: 14, tone: 'error' },
          { label: 'Standby', value: 33, tone: 'warning' }
        ]
      },
      {
        title: 'Standby DT Detail',
        total: 0,
        unit: 'Unit',
        items: [
          { label: 'No Opr/Drv', value: 0, tone: 'error' },
          { label: 'No Job', value: 0, tone: 'warning' },
          { label: 'Fuel', value: 0, tone: 'success' },
          { label: 'Hujan', value: 0, tone: 'info' },
          { label: 'Jalan Licin', value: 0, tone: 'primary' },
          { label: 'Public', value: 0, tone: 'primary' },
          { label: 'Arahan', value: 0, tone: 'warning' },
          { label: 'Commissioning', value: 0, tone: 'info' }
        ]
      },
      {
        title: 'Purchase Request',
        total: 0,
        unit: 'PR',
        items: [
          { label: 'New Request', value: 0, tone: 'info' },
          { label: 'Approved', value: 0, tone: 'success' },
          { label: 'Overdue', value: 0, tone: 'error' }
        ]
      },
      {
        title: 'Purchase Order',
        total: 0,
        unit: 'PO',
        items: [
          { label: 'Open', value: 0, tone: 'warning' },
          { label: 'Verify', value: 0, tone: 'info' },
          { label: 'Paid', value: 0, tone: 'success' }
        ]
      }
    ]
  },
  manpower: {
    total: 428,
    unit: 'Person',
    items: [
      { label: 'Finger', value: 321, detail: 'Recorded', tone: 'info' },
      { label: 'Sakit', value: 7, detail: 'Person', tone: 'error' },
      { label: 'Izin', value: 12, detail: 'Person', tone: 'warning' },
      { label: 'Cuti', value: 9, detail: 'Person', tone: 'primary' },
      { label: 'Tanpa Status', value: 3, detail: 'Need update', tone: 'error' }
    ],
    siteGroups: [
      { label: 'Site Konawe Utara', value: 248, tone: 'info' },
      { label: 'Site Morowali', value: 112, tone: 'success' },
      { label: 'Site Kolaka', value: 68, tone: 'warning' }
    ]
  }
};

export default siteMonitoringMock;
