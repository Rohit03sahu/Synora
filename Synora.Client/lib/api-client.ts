import { supabase } from '@/lib/supabase-client';

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5247').replace(/\/$/, '');

async function authorizedHeaders(body?: unknown): Promise<Headers> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Could not read the current authentication session: ${error.message}`);
  }
  if (!data.session?.access_token) {
    throw new Error('Sign in to access your health data.');
  }

  const headers = new Headers({
    Authorization: `Bearer ${data.session.access_token}`,
    Accept: 'application/json',
  });
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await authorizedHeaders(init.body);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));

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
    const problem = await response.json().catch(() => null) as { title?: string; detail?: string; errors?: Record<string, string[]> } | null;
    const validation = problem?.errors
      ? Object.values(problem.errors).flat().join(' ')
      : '';
    throw new Error(validation || problem?.detail || problem?.title || `API request failed (${response.status}).`);
  }

  return response;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await request(path);
  if (response.status === 204) {
    throw new Error(`The API returned no data for ${path}.`);
  }
  return response.json() as Promise<T>;
}

export async function apiWrite(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<void> {
  const response = await request(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status !== 204 && response.status !== 201 && response.status !== 202) {
    await response.body?.cancel();
  }
}

export async function apiSend<T>(path: string, body: unknown): Promise<T> {
  const response = await request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (response.status === 204) {
    throw new Error(`The API returned no data after POST ${path}.`);
  }
  return response.json() as Promise<T>;
}
