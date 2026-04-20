'use client';

import CheckerPagePlaceholder from '../components/CheckerPagePlaceholder';

export default function DailyCheckerStockpileHitungRitView() {
  return (
    <CheckerPagePlaceholder
      heading="Hitung Rit Checker Stockpile"
      routeTitle="Daily Checker Stockpile"
      backUrl="/daily-checker-stockpile"
      description="Halaman hitung rit stockpile akan menjadi owner counter increment/decrement dumptruck berdasarkan scope final dan ritase_stockpile_id."
    />
  );
}
