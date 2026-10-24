import { accessToken, clearUserSession } from '@/lib/user-session';

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5247').replace(/\/$/, '');

function requestHeaders(body: BodyInit | null | undefined, authenticated: boolean): Headers {
  const token = authenticated ? accessToken() : null;
  if (authenticated && !token) {
    throw new Error('Sign in to access your health data.');
  }

  const headers = new Headers({ Accept: 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (
    body !== undefined &&
    body !== null &&
    !(typeof FormData !== 'undefined' && body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function request(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<Response> {
  const headers = requestHeaders(init.body, authenticated);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  if (init.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed.';
    throw new Error(`Could not reach the Synora API at ${apiBaseUrl}: ${message}`);
  }

  if (!response.ok) {
    if (authenticated && response.status === 401) {
      clearUserSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('synora:session-expired'));
      }
    }
    const problem = await response.json().catch(() => null) as {
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    } | null;
    const validation = problem?.errors
      ? Object.values(problem.errors).flat().join(' ')
      : '';
    throw new Error(validation || problem?.detail || problem?.title || `API request failed (${response.status}).`);
  }

  return response;
}

async function send<T>(
  path: string,
  body: unknown,
  authenticated: boolean,
): Promise<T> {
  const response = await request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }, authenticated);
  if (response.status === 204) {
    throw new Error(`The API returned no data after POST ${path}.`);
  }
  return response.json() as Promise<T>;
}

async function write(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  authenticated: boolean,
): Promise<void> {
  const response = await request(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, authenticated);
  if (response.status !== 204 && response.status !== 201 && response.status !== 202) {
    await response.body?.cancel();
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await request(path);
  if (response.status === 204) {
    throw new Error(`The API returned no data for ${path}.`);
  }
  return response.json() as Promise<T>;
}

export async function apiWrite(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<void> {
  return write(path, method, body, true);
}

export async function apiPublicWrite(path: string, body: unknown): Promise<void> {
  return write(path, 'POST', body, false);
}

export async function apiSend<T>(path: string, body: unknown): Promise<T> {
  return send<T>(path, body, true);
}

export async function apiPublicSend<T>(path: string, body: unknown): Promise<T> {
  return send<T>(path, body, false);
}

export async function apiUpload<T>(path: string, fieldName: string, file: File): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);
  const response = await request(path, {
    method: 'POST',
    body: form,
  });
  if (response.status === 204) {
    throw new Error(`The API returned no data after POST ${path}.`);
  }
  return response.json() as Promise<T>;
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await request(path);
  return response.blob();
}
