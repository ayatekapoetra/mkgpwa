'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { updateCachedSession } from 'utils/session-cache';

export default function SessionCacheSync() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status !== 'loading') updateCachedSession(session || null);
  }, [session, status]);
  return null;
}
