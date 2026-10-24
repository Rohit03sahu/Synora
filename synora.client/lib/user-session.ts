export interface UserSession {
  accessToken: string;
  expiresAt: string;
}

const storageKey = 'synora.user-session';

export function readUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(storageKey);
  if (!value) return null;

  try {
    const session = JSON.parse(value) as UserSession;
    const expiresAt = Date.parse(session.expiresAt);
    if (
      typeof session.accessToken !== 'string' ||
      typeof session.expiresAt !== 'string' ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      clearUserSession();
      return null;
    }
    return session;
  } catch {
    clearUserSession();
    return null;
  }
}

export function saveUserSession(session: UserSession): void {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearUserSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKey);
  }
}

export function accessToken(): string | null {
  return readUserSession()?.accessToken ?? null;
}
