export interface CoordinatePair {
  latitude: number;
  longitude: number;
}

const round6 = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

export const isValidLatitude = (value: number): boolean => value >= -90 && value <= 90;

export const isValidLongitude = (value: number): boolean => value >= -180 && value <= 180;

export const normalizeCoordinatePair = (
  latitude: number,
  longitude: number
): CoordinatePair | null => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }

  return {
    latitude: round6(latitude),
    longitude: round6(longitude),
  };
};

/**
 * Extract a coordinate pair from raw text — a full (already-expanded) Google
 * Maps URL, or a bare "lat,lng" string. Patterns are tried most-reliable first:
 *   1. `...!3d<lat>!4d<lng>`  (the place pin embedded in the /data= segment)
 *   2. `.../@<lat>,<lng>,<zoom>z`  (map center in the path)
 *   3. `?q=`/`query=`/`ll=`/`center=`/`destination=`/`daddr=` `<lat>,<lng>`
 */
export const extractCoordinatesFromText = (input: string): CoordinatePair | null => {
  if (!input) return null;
  const text = input.trim();

  // Bare "lat,lng" (optionally with surrounding whitespace).
  const raw = text.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (raw) {
    return normalizeCoordinatePair(Number(raw[1]), Number(raw[2]));
  }

  const patterns: RegExp[] = [
    /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
    /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
    /[?&](?:q|query|ll|sll|center|destination|daddr)=(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match) {
      const coord = normalizeCoordinatePair(Number(match[1]), Number(match[2]));
      if (coord) return coord;
    }
  }

  return null;
};

const SHORT_LINK_HOSTS = ['goo.gl', 'maps.app.goo.gl', 'g.co', 'maps.google.com'];

const isShortLink = (url: string): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SHORT_LINK_HOSTS.some((shortHost) => host === shortHost || host.endsWith(`.${shortHost}`));
  } catch {
    return false;
  }
};

/**
 * Follow a short link's redirect(s) and return the final URL plus a slice of the
 * response body. Some shortened Google Maps links (maps.app.goo.gl) land on a page
 * whose coordinates live in the HTML rather than the final URL, so we scan both.
 */
const resolveShortLink = async (url: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TayyabTraders/1.0)',
      },
    });

    const finalUrl = response.url || url;
    let body = '';
    try {
      body = (await response.text()).slice(0, 200_000);
    } catch {
      body = '';
    }

    return `${finalUrl}\n${body}`;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Parse coordinates out of any Google Maps location link (or bare "lat,lng").
 * Resolves shortened links (goo.gl / maps.app.goo.gl) by following the redirect.
 * Returns null if no coordinates can be found.
 */
export const parseGoogleMapsUrl = async (input: string): Promise<CoordinatePair | null> => {
  if (!input || !input.trim()) return null;
  const text = input.trim();

  // Fast path: coordinates already present in the pasted string.
  const direct = extractCoordinatesFromText(text);
  if (direct) return direct;

  // Shortened links need to be expanded before they reveal coordinates.
  if (isShortLink(text)) {
    try {
      const resolved = await resolveShortLink(text);
      if (resolved) {
        const fromResolved = extractCoordinatesFromText(resolved);
        if (fromResolved) return fromResolved;
      }
    } catch {
      // Network/redirect failure — fall through to null so the caller can react.
    }
  }

  return null;
};

export const geocodeAddress = async (
  siteAddress: string
): Promise<Partial<CoordinatePair>> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(siteAddress)}`,
      {
        headers: {
          'User-Agent': 'TayyabTraders/1.0',
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = payload?.[0];
    if (!first?.lat || !first?.lon) {
      return {};
    }

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    const normalized = normalizeCoordinatePair(latitude, longitude);
    if (!normalized) {
      return {};
    }

    return normalized;
  } catch {
    return {};
  }
};
