'use client';

import CheckerPagePlaceholder from '../components/CheckerPagePlaceholder';

export default function DailyCheckerStockpileCreateView() {
  return (
    <CheckerPagePlaceholder
      heading="Create Scope Checker Stockpile"
      routeTitle="Daily Checker Stockpile"
      backUrl="/daily-checker-stockpile"
      description="Halaman create akan difungsikan sebagai setup scope (date_ops, shift, material, stockpile, DOM, dumptruck, driver) dan seed dumptruck sebelum masuk hitung rit."
    />
  );
}
