import { distanceMetersBetween } from '@core/location';
import type { HttpClient } from '@core/network';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';
import type { TourEvent } from '../model';
import type { EventRepository } from './EventRepository';

interface TourApiResponse {
  readonly response?: {
    readonly header?: {
      readonly resultCode?: string;
      readonly resultMsg?: string;
    };
    readonly body?: {
      readonly items?: {
        readonly item?: TourApiItem | readonly TourApiItem[];
      };
    };
  };
}

interface TourApiItem {
  readonly contentid?: string | number;
  readonly contenttypeid?: string | number;
  readonly title?: string;
  readonly addr1?: string;
  readonly addr2?: string;
  readonly firstimage?: string;
  readonly firstimage2?: string;
  readonly overview?: string;
  readonly homepage?: string;
  readonly tel?: string;
  readonly mapx?: string | number;
  readonly mapy?: string | number;
  readonly eventstartdate?: string | number;
  readonly eventenddate?: string | number;
}

interface TourApiHeader {
  readonly resultCode?: string;
  readonly resultMsg?: string;
}

const TOUR_APP_NAME = 'Stampy';
const TOUR_MOBILE_OS = 'ETC';
const DEFAULT_ROWS = 100;
const EVENT_CONTENT_TYPE_ID = '15';

export class HttpEventRepository implements EventRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly serviceKey: string,
  ) {}

  async searchNearby(center: Coordinates, radiusMeters: number): Promise<TourEvent[]> {
    const response = await this.httpClient.get<TourApiResponse>('searchFestival2', {
      ...this.defaultParams(),
      arrange: 'E',
      eventStartDate: todayCompactDate(),
    });

    return this.toTourEvents(response).filter(
      (event) => distanceMetersBetween(center, event.location) <= radiusMeters,
    );
  }

  async byId(contentId: string): Promise<TourEvent | null> {
    const response = await this.httpClient.get<TourApiResponse>('detailCommon2', {
      ...this.defaultParams(),
      contentId,
      contentTypeId: EVENT_CONTENT_TYPE_ID,
    });

    return this.toTourEvents(response)[0] ?? null;
  }

  async search(query: string): Promise<TourEvent[]> {
    const response = await this.httpClient.get<TourApiResponse>('searchKeyword2', {
      ...this.defaultParams(),
      arrange: 'A',
      contentTypeId: EVENT_CONTENT_TYPE_ID,
      keyword: query,
    });

    return this.toTourEvents(response);
  }

  private defaultParams() {
    return {
      MobileApp: TOUR_APP_NAME,
      MobileOS: TOUR_MOBILE_OS,
      _type: 'json',
      numOfRows: DEFAULT_ROWS,
      pageNo: 1,
      serviceKey: this.serviceKey,
    };
  }

  private toTourEvents(response: TourApiResponse): TourEvent[] {
    const header = response.response?.header;

    if (isNoDataResult(header)) {
      return [];
    }

    if (header?.resultCode !== '0000') {
      throw new Error(`TourAPI ${header?.resultCode ?? 'UNKNOWN'}: ${header?.resultMsg ?? ''}`);
    }

    return normalizeItems(response)
      .map(toTourEvent)
      .filter((event): event is TourEvent => event !== null)
      .filter((event) => event.endDate >= todayCompactDate());
  }
}

const normalizeItems = (response: TourApiResponse): readonly TourApiItem[] => {
  const item = response.response?.body?.items?.item;

  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
};

const toTourEvent = (item: TourApiItem): TourEvent | null => {
  const contentId = toNonEmptyString(item.contentid);
  const title = toNonEmptyString(item.title);
  const contentTypeId = toNonEmptyString(item.contenttypeid) ?? EVENT_CONTENT_TYPE_ID;
  const mapx = toFiniteNumber(item.mapx);
  const mapy = toFiniteNumber(item.mapy);
  const startDate = toCompactDate(item.eventstartdate);
  const endDate = toCompactDate(item.eventenddate);
  const imageUrls = toUniqueStrings([item.firstimage, item.firstimage2]);
  const thumbnailUrl = imageUrls[0];

  if (
    !contentId ||
    !title ||
    contentTypeId !== EVENT_CONTENT_TYPE_ID ||
    mapx === null ||
    mapy === null ||
    !startDate ||
    !endDate
  ) {
    return null;
  }

  return {
    contentId,
    title,
    address: [item.addr1, item.addr2].map(toNonEmptyString).filter(Boolean).join(' '),
    contentTypeId,
    location: {
      latitude: asLatitude(mapy),
      longitude: asLongitude(mapx),
    },
    startDate,
    endDate,
    thumbnailUrl,
    imageUrls,
    overview: toNormalizedText(item.overview) ?? undefined,
    homepage: toHomepageText(item.homepage) ?? undefined,
    telephone: toNormalizedText(item.tel) ?? undefined,
  };
};

const toNonEmptyString = (value: string | number | undefined): string | null => {
  if (value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const toFiniteNumber = (value: string | number | undefined): number | null => {
  const text = toNonEmptyString(value);

  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

const toCompactDate = (value: string | number | undefined): string | null => {
  const text = toNonEmptyString(value)?.replace(/\D/g, '') ?? '';

  return text.length === 8 ? text : null;
};

const todayCompactDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
};

const toUniqueStrings = (values: readonly (string | number | undefined)[]): readonly string[] => {
  const unique = new Set<string>();

  for (const value of values) {
    const text = toNonEmptyString(value);
    if (text) {
      unique.add(text);
    }
  }

  return [...unique];
};

const toNormalizedText = (value: string | number | undefined): string | null => {
  const text = toNonEmptyString(value);
  if (!text) {
    return null;
  }

  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toHomepageText = (value: string | number | undefined): string | null => {
  const rawText = toNonEmptyString(value);
  if (!rawText) {
    return null;
  }

  const hrefMatch = rawText.match(/href\s*=\s*["']([^"']+)["']/i);
  if (hrefMatch?.[1]) {
    return hrefMatch[1].trim();
  }

  return rawText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isNoDataResult = (header: TourApiHeader | undefined): boolean => {
  if (!header) {
    return false;
  }

  const resultCode = toNonEmptyString(header.resultCode);
  const resultMsg = toNonEmptyString(header.resultMsg);

  return resultCode === '03' || resultMsg?.includes('NODATA_ERROR') === true;
};
