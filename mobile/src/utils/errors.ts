/**
 * Centralized error parsing for the mobile app.
 * Takes an unknown thrown value (axios error, fetch error, plain Error, string)
 * and returns a structured shape the UI can render consistently.
 */

export type ApiErrorKind =
  | 'network'
  | 'auth'
  | 'forbidden'
  | 'notfound'
  | 'validation'
  | 'conflict'
  | 'server'
  | 'unknown';

export interface ParsedApiError {
  kind: ApiErrorKind;
  title: string;
  description: string;
  /** The underlying message, useful for debug surfaces. */
  rawMessage: string;
  /** HTTP status if available. */
  status?: number;
}

const PRESETS: Record<ApiErrorKind, { icon: string; title: string; description: string }> = {
  network: {
    icon: 'wifi-off',
    title: 'No connection',
    description: "We couldn't reach the server. Check your internet and try again.",
  },
  auth: {
    icon: 'lock-alert',
    title: 'Session expired',
    description: 'Please sign in again to continue.',
  },
  forbidden: {
    icon: 'shield-off',
    title: 'Not allowed',
    description: "You don't have permission to do this.",
  },
  notfound: {
    icon: 'help-circle-outline',
    title: 'Not found',
    description: "We couldn't find what you were looking for.",
  },
  validation: {
    icon: 'alert-circle-outline',
    title: 'Check the details',
    description: 'Some fields need attention.',
  },
  conflict: {
    icon: 'alert-octagon-outline',
    title: 'Already exists',
    description: 'A record like this already exists.',
  },
  server: {
    icon: 'cloud-alert',
    title: 'Server error',
    description: "Something went wrong on our side. Please try again in a moment.",
  },
  unknown: {
    icon: 'alert-outline',
    title: 'Something went wrong',
    description: 'Please try again.',
  },
};

export const ERROR_ICONS = Object.fromEntries(
  Object.entries(PRESETS).map(([k, v]) => [k, v.icon])
) as Record<ApiErrorKind, string>;

const extractMessage = (raw: any): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (raw instanceof Error) return raw.message || '';
  if (typeof raw === 'object') {
    const responseData = raw?.response?.data;
    if (responseData?.message) return String(responseData.message);
    if (responseData?.error) return String(responseData.error);
    if (raw.message) return String(raw.message);
  }
  return '';
};

export const parseApiError = (error: unknown): ParsedApiError => {
  const anyErr = error as any;
  const status: number | undefined = anyErr?.response?.status;
  const rawMessage = extractMessage(anyErr);
  const lowered = rawMessage.toLowerCase();
  const code = String(anyErr?.code || '').toLowerCase();

  // Network failures
  if (
    code === 'err_network' ||
    code === 'econnaborted' ||
    code === 'etimedout' ||
    lowered.includes('network error') ||
    lowered.includes('timeout') ||
    lowered.includes('failed to fetch') ||
    lowered.includes('unable to connect')
  ) {
    return { kind: 'network', status, rawMessage, ...PRESETS.network };
  }

  if (status === 401) {
    // Invalid credentials at login surface specifically
    if (lowered.includes('invalid email') || lowered.includes('invalid credentials')) {
      return {
        kind: 'auth',
        status,
        rawMessage,
        title: 'Invalid credentials',
        description: 'The email or password you entered is incorrect.',
      };
    }
    return { kind: 'auth', status, rawMessage, ...PRESETS.auth };
  }

  if (status === 403) {
    return { kind: 'forbidden', status, rawMessage, ...PRESETS.forbidden };
  }

  if (status === 404) {
    return { kind: 'notfound', status, rawMessage, ...PRESETS.notfound };
  }

  if (status === 409) {
    return {
      kind: 'conflict',
      status,
      rawMessage,
      ...PRESETS.conflict,
      description: rawMessage || PRESETS.conflict.description,
    };
  }

  if (status === 400 || status === 422) {
    return {
      kind: 'validation',
      status,
      rawMessage,
      ...PRESETS.validation,
      description: rawMessage || PRESETS.validation.description,
    };
  }

  if (status && status >= 500) {
    return { kind: 'server', status, rawMessage, ...PRESETS.server };
  }

  return { kind: 'unknown', status, rawMessage, ...PRESETS.unknown };
};
