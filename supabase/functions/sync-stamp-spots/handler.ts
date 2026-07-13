const TOUR_API_DETAIL_URL = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';
const SUPPORTED_CONTENT_TYPE_IDS = new Set(['12', '14', '15', '25', '28', '32', '38', '39']);
const MAX_CONTENT_IDS = 20;
const UPSTREAM_TIMEOUT_MS = 10_000;

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface SyncStampSpotsConfig {
  readonly stampSpotSyncToken: string;
  readonly tourApiServiceKey: string;
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
}

interface StampSpotRow {
  readonly content_id: string;
  readonly title: string;
  readonly kind: 'spot' | 'event';
  readonly location: string;
}

class SyncFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export const createSyncStampSpotsHandler = (
  config: SyncStampSpotsConfig,
  fetcher: Fetcher = fetch,
) => {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'method_not_allowed' }, { allow: 'POST' });
    }

    if (!(await hasValidSyncToken(request, config.stampSpotSyncToken))) {
      return jsonResponse(401, { error: 'unauthorized' });
    }

    try {
      const contentIds = await readContentIds(request);
      const rows = await Promise.all(
        contentIds.map((contentId) =>
          fetchTourApiSpot(contentId, config.tourApiServiceKey, fetcher)
        ),
      );

      await upsertStampSpots(rows, config, fetcher);

      return jsonResponse(200, {
        syncedCount: rows.length,
        contentIds: rows.map((row) => row.content_id),
      });
    } catch (error) {
      if (error instanceof SyncFailure) {
        return jsonResponse(error.status, { error: error.code });
      }

      return jsonResponse(500, { error: 'internal_error' });
    }
  };
};

const hasValidSyncToken = (request: Request, expectedToken: string): Promise<boolean> => {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return Promise.resolve(false);
  }

  return timingSafeEqual(authorization.slice('Bearer '.length), expectedToken);
};

const timingSafeEqual = async (actual: string, expected: string): Promise<boolean> => {
  const encoder = new TextEncoder();
  const [actualDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(actual)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const actualBytes = new Uint8Array(actualDigest);
  const expectedBytes = new Uint8Array(expectedDigest);
  let difference = 0;

  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= actualBytes[index] ^ expectedBytes[index];
  }

  return difference === 0;
};

const readContentIds = async (request: Request): Promise<readonly string[]> => {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new SyncFailure(400, 'invalid_request');
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new SyncFailure(400, 'invalid_request');
  }

  if (!isRecord(payload) || !Array.isArray(payload.contentIds)) {
    throw new SyncFailure(400, 'invalid_request');
  }

  if (payload.contentIds.length === 0 || payload.contentIds.length > MAX_CONTENT_IDS) {
    throw new SyncFailure(400, 'invalid_content_ids');
  }

  const normalized = payload.contentIds.map((value) => {
    if (typeof value !== 'string') {
      throw new SyncFailure(400, 'invalid_content_ids');
    }

    const contentId = value.trim();

    if (!/^\d{1,32}$/.test(contentId)) {
      throw new SyncFailure(400, 'invalid_content_ids');
    }

    return contentId;
  });

  return [...new Set(normalized)];
};

const fetchTourApiSpot = async (
  contentId: string,
  serviceKey: string,
  fetcher: Fetcher,
): Promise<StampSpotRow> => {
  const url = new URL(TOUR_API_DETAIL_URL);
  url.search = new URLSearchParams({
    serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'Stampy',
    _type: 'json',
    contentId,
    numOfRows: '1',
    pageNo: '1',
  }).toString();

  let response: Response;

  try {
    response = await fetcher(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    throw new SyncFailure(502, 'tour_api_unavailable');
  }

  if (!response.ok) {
    throw new SyncFailure(502, 'tour_api_unavailable');
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new SyncFailure(502, 'tour_api_invalid_response');
  }

  return normalizeTourApiSpot(payload, contentId);
};

const normalizeTourApiSpot = (payload: unknown, requestedContentId: string): StampSpotRow => {
  const root = asRecord(payload);
  const response = asRecord(root?.response);
  const header = asRecord(response?.header);
  const resultCode = toText(header?.resultCode);

  if (resultCode !== '0000') {
    throw new SyncFailure(502, 'tour_api_invalid_response');
  }

  const body = asRecord(response?.body);
  const items = asRecord(body?.items);
  const rawItem = items?.item;
  const candidates = Array.isArray(rawItem) ? rawItem : rawItem === undefined ? [] : [rawItem];
  const matches = candidates
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => {
      return item !== null && toText(item.contentid) === requestedContentId;
    });

  if (matches.length !== 1) {
    throw new SyncFailure(502, 'tour_api_invalid_response');
  }

  const item = matches[0];
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const contentTypeId = toText(item.contenttypeid);
  const longitude = toCoordinate(item.mapx, -180, 180);
  const latitude = toCoordinate(item.mapy, -90, 90);

  if (
    title.length === 0 ||
    !contentTypeId ||
    !SUPPORTED_CONTENT_TYPE_IDS.has(contentTypeId) ||
    longitude === null ||
    latitude === null
  ) {
    throw new SyncFailure(502, 'tour_api_invalid_response');
  }

  return {
    content_id: requestedContentId,
    title,
    kind: contentTypeId === '15' ? 'event' : 'spot',
    location: `SRID=4326;POINT(${longitude} ${latitude})`,
  };
};

const upsertStampSpots = async (
  rows: readonly StampSpotRow[],
  config: SyncStampSpotsConfig,
  fetcher: Fetcher,
): Promise<void> => {
  const url = new URL('/rest/v1/stamp_spots', config.supabaseUrl);
  url.searchParams.set('on_conflict', 'content_id');

  let response: Response;

  try {
    response = await fetcher(url, {
      method: 'POST',
      headers: {
        apikey: config.supabaseServiceRoleKey,
        authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        'content-type': 'application/json',
        prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    });
  } catch {
    throw new SyncFailure(500, 'catalog_write_failed');
  }

  if (!response.ok) {
    throw new SyncFailure(500, 'catalog_write_failed');
  }
};

const toCoordinate = (value: unknown, minimum: number, maximum: number): number | null => {
  const text = toText(value);

  if (!text) {
    return null;
  }

  const coordinate = Number(text);
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
    ? coordinate
    : null;
};

const toText = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return isRecord(value) ? value : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const jsonResponse = (
  status: number,
  body: Record<string, unknown>,
  headers?: HeadersInit,
): Response => {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      ...headers,
    },
  });
};
