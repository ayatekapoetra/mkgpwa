'use client';

import CheckerPagePlaceholder from '../components/CheckerPagePlaceholder';

export default function DailyCheckerStockpileUnmatchedView() {
  return (
    <CheckerPagePlaceholder
      heading="Unmatched Checker Stockpile"
      routeTitle="Daily Checker Stockpile"
      backUrl="/daily-checker-stockpile"
      description="Halaman unmatched akan menampilkan data pit yang belum match ke stockpile, termasuk flow accept via modal dan cancel/delete online-first dengan fallback offline."
    />
  );
}
