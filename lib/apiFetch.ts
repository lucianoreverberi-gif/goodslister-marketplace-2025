// API fetch helper with automatic retry + timeout + user-friendly error messages
// Usage:
//   const data = await apiFetch<Listing>('/api/listings/get?id=' + id);
//   const result = await apiPost<Booking>('/api/booking/create', payload);

export interface ApiFetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    skipErrorLog?: boolean;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public statusText: string,
        public body?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }

    get isTimeout() { return this.status === 0 && this.message.includes('timeout'); }
    get isNetwork() { return this.status === 0; }
    get isServer() { return this.status >= 500; }
    get isClient() { return this.status >= 400 && this.status < 500; }
    get isRateLimit() { return this.status === 429; }
    get isAuth() { return this.status === 401 || this.status === 403; }

    toUserMessage(): string {
        if (this.isTimeout) return 'The request took too long. Please check your connection and try again.';
        if (this.isNetwork) return 'Cannot reach our servers. Please check your internet connection.';
        if (this.isRateLimit) return 'Too many requests. Please wait a moment and try again.';
        if (this.isAuth) return 'You need to sign in to do that.';
        if (this.isServer) return 'Our servers hit a snag. Please try again in a moment.';
        if (this.status === 404) return 'We could not find what you were looking for.';
        return this.body?.error || this.body?.message || 'Something went wrong. Please try again.';
    }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

export async function apiFetch<T = any>(url: string, options: ApiFetchOptions = {}): Promise<T> {
    const { timeout = 30000, retries = 2, retryDelay = 1000, skipErrorLog = false, headers, ...fetchOptions } = options;

    const method = (fetchOptions.method || 'GET').toUpperCase();
    const finalHeaders: Record<string, string> = {
        ...(method !== 'GET' && method !== 'HEAD' ? { 'Content-Type': 'application/json' } : {}),
        ...(headers as Record<string, string> || {}),
    };

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, { ...fetchOptions, headers: finalHeaders }, timeout);

            let body: any = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                body = await response.json().catch(() => null);
            } else if (response.status !== 204) {
                body = await response.text().catch(() => null);
            }

            if (!response.ok) {
                const error = new ApiError(
                    body?.error || body?.message || 'Request failed with status ' + response.status,
                    response.status,
                    response.statusText,
                    body
                );

                const shouldRetry = attempt < retries && (error.isServer || error.isRateLimit);
                if (shouldRetry) {
                    lastError = error;
                    const delay = retryDelay * Math.pow(2, attempt);
                    if (!skipErrorLog) console.warn('[apiFetch] Retry ' + (attempt + 1) + '/' + retries + ' for ' + url + ' after ' + delay + 'ms');
                    await sleep(delay);
                    continue;
                }

                if (!skipErrorLog) console.error('[apiFetch]', method, url, response.status, body);
                throw error;
            }

            return body as T;
        } catch (err: any) {
            if (err instanceof ApiError) throw err;

            const isAbort = err.name === 'AbortError';
            const message = isAbort ? 'Request timeout' : (err.message || 'Network error');
            const error = new ApiError(message, 0, isAbort ? 'timeout' : 'network');

            const shouldRetry = attempt < retries;
            if (shouldRetry) {
                lastError = error;
                const delay = retryDelay * Math.pow(2, attempt);
                if (!skipErrorLog) console.warn('[apiFetch] Network retry ' + (attempt + 1) + '/' + retries + ' for ' + url + ' after ' + delay + 'ms');
                await sleep(delay);
                continue;
            }

            if (!skipErrorLog) console.error('[apiFetch]', method, url, message);
            throw error;
        }
    }

    throw lastError || new ApiError('Unknown error', 0, 'unknown');
}

export const apiGet = <T = any>(url: string, options?: Omit<ApiFetchOptions, 'method'>) =>
    apiFetch<T>(url, { ...options, method: 'GET' });

export const apiPost = <T = any>(url: string, body?: any, options?: Omit<ApiFetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(url, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const apiPut = <T = any>(url: string, body?: any, options?: Omit<ApiFetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(url, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T = any>(url: string, options?: Omit<ApiFetchOptions, 'method'>) =>
    apiFetch<T>(url, { ...options, method: 'DELETE' });
