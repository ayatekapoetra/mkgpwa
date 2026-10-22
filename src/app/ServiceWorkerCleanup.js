'use client';

import { useEffect } from 'react';
import { cleanupLegacyPwa } from 'lib/legacy-pwa-cleanup';

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    void cleanupLegacyPwa().catch((error) => console.warn('Legacy PWA cleanup failed:', error));
  }, []);
  return null;
}
