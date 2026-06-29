import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthUser = {
  id: number;
  email: string;
  full_name?: string;
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const memoryStore: Record<string, string> = {};

async function safeSetItem(key: string, value: string) {
  try {
    if (typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback to memory store if native storage is unavailable.
  }

  memoryStore[key] = value;
}

async function safeGetItem(key: string) {
  try {
    if (typeof AsyncStorage.getItem === 'function') {
      const value = await AsyncStorage.getItem(key);
      if (value !== null && value !== undefined) return value;
    }
  } catch {
    // Fallback to memory store if native storage is unavailable.
  }

  return memoryStore[key] ?? null;
}

async function safeRemoveItem(key: string) {
  try {
    if (typeof AsyncStorage.removeItem === 'function') {
      await AsyncStorage.removeItem(key);
    }
  } catch {
    // Ignore and fallback to memory cleanup.
  }

  delete memoryStore[key];
}

function normalizeToken(rawToken: string | null | undefined): string | null {
  if (!rawToken) return null;

  const trimmed = rawToken.trim();
  if (!trimmed) return null;

  return trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
}

export async function saveAuthSession(token: string | null | undefined, user: AuthUser) {
  const normalized = normalizeToken(token);

  if (!normalized) {
    throw new Error('Missing auth token.');
  }

  try {
    if (typeof AsyncStorage.multiSet === 'function') {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, normalized],
        [USER_KEY, JSON.stringify(user)]
      ]);
      return;
    }
  } catch {
    // Fall through to safe item writes.
  }

  await safeSetItem(TOKEN_KEY, normalized);
  await safeSetItem(USER_KEY, JSON.stringify(user));
}

export async function getAuthToken() {
  return safeGetItem(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const userRaw = await safeGetItem(USER_KEY);
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw) as AuthUser;
  } catch {
    return null;
  }
}

export async function clearAuthSession() {
  try {
    if (typeof AsyncStorage.multiRemove === 'function') {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      delete memoryStore[TOKEN_KEY];
      delete memoryStore[USER_KEY];
      return;
    }
  } catch {
    // Fall through to safe item removals.
  }

  await safeRemoveItem(TOKEN_KEY);
  await safeRemoveItem(USER_KEY);
}
