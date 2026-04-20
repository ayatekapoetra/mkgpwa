'use client';

import CheckerPagePlaceholder from '../components/CheckerPagePlaceholder';

export default function DailyCheckerPitHitungRitView() {
  return (
    <CheckerPagePlaceholder
      heading="Hitung Rit Checker PIT"
      routeTitle="Daily Checker PIT"
      backUrl="/daily-checker-pit"
      description="Halaman hitung rit akan menangani increment/decrement ritase dumptruck berdasarkan scope group PIT dengan status sinkronisasi online-first/offline-fallback."
    />
  );
}
