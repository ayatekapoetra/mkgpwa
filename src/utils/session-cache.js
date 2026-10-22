import { getSession } from 'next-auth/react';

const MAX_AGE = 60_000;
let cachedSession;
let expiresAt = 0;
let pendingSession = null;
let revision = 0;

// Memory only: never share a user's session between server-side requests.
export function updateCachedSession(session) {
  if (typeof window === 'undefined') return;
  revision += 1;
  cachedSession = session;
  expiresAt = Date.now() + MAX_AGE;
  pendingSession = null;
}

export async function getCachedSession() {
  if (typeof window === 'undefined') return null;
  const tokenExpired = cachedSession?.token?.exp && cachedSession.token.exp * 1000 <= Date.now();
  if (cachedSession !== undefined && Date.now() < expiresAt && !tokenExpired) return cachedSession;
  if (pendingSession) return pendingSession;

  const startedAtRevision = revision;
  const request = getSession({ broadcast: false }).then((session) => {
    // A sign-out or profile/session update takes precedence over an older fetch.
    if (revision === startedAtRevision) {
      cachedSession = session;
      expiresAt = Date.now() + MAX_AGE;
    }
    return cachedSession;
  }).finally(() => {
    if (pendingSession === request) pendingSession = null;
  });
  pendingSession = request;
  return request;
}
