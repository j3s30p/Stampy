import type { HttpClient } from '@core/network';
import { asLatitude, asLongitude, type Coordinates } from '@shared/types';
import type { TourSpot } from '../model';
import type { TourRepository } from './TourRepository';

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
  readonly mapx?: string | number;
  readonly mapy?: string | number;
}

interface TourApiHeader {
  readonly resultCode?: string;
  readonly resultMsg?: string;
}

const TOUR_APP_NAME = 'Stampy';
const TOUR_MOBILE_OS = 'ETC';
const DEFAULT_ROWS = 20;

export class HttpTourRepository implements TourRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly serviceKey: string,
  ) {}

  async searchNearby(center: Coordinates, radiusMeters: number): Promise<TourSpot[]> {
    const response = await this.httpClient.get<TourApiResponse>('locationBasedList2', {
      ...this.defaultParams(),
      arrange: 'E',
      mapX: center.longitude,
      mapY: center.latitude,
      radius: radiusMeters,
    });

    return this.toTourSpots(response);
  }

  async byId(contentId: string): Promise<TourSpot | null> {
    const response = await this.httpClient.get<TourApiResponse>('detailCommon2', {
      ...this.defaultParams(),
      contentId,
    });

    return this.toTourSpots(response)[0] ?? null;
  }

  async search(query: string): Promise<TourSpot[]> {
    const response = await this.httpClient.get<TourApiResponse>('searchKeyword2', {
      ...this.defaultParams(),
      arrange: 'A',
      contentTypeId: 12,
      keyword: query,
    });

    return this.toTourSpots(response);
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

  private toTourSpots(response: TourApiResponse): TourSpot[] {
    const header = response.response?.header;

    if (isNoDataResult(header)) {
      return [];
    }

    if (header?.resultCode !== '0000') {
      throw new Error(`TourAPI ${header?.resultCode ?? 'UNKNOWN'}: ${header?.resultMsg ?? ''}`);
    }

    return normalizeItems(response)
      .map(toTourSpot)
      .filter((spot): spot is TourSpot => spot !== null);
  }
}

const normalizeItems = (response: TourApiResponse): readonly TourApiItem[] => {
  const item = response.response?.body?.items?.item;

  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
};

const toTourSpot = (item: TourApiItem): TourSpot | null => {
  const contentId = toNonEmptyString(item.contentid);
  const title = toNonEmptyString(item.title);
  const mapx = toFiniteNumber(item.mapx);
  const mapy = toFiniteNumber(item.mapy);
  const thumbnailUrl = toNonEmptyString(item.firstimage) ?? toNonEmptyString(item.firstimage2);

  if (!contentId || !title || mapx === null || mapy === null) {
    return null;
  }

  return {
    contentId,
    title,
    address: [item.addr1, item.addr2].map(toNonEmptyString).filter(Boolean).join(' '),
    contentTypeId: toNonEmptyString(item.contenttypeid) ?? '12',
    location: {
      latitude: asLatitude(mapy),
      longitude: asLongitude(mapx),
    },
    thumbnailUrl: thumbnailUrl ?? undefined,
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

const isNoDataResult = (header: TourApiHeader | undefined): boolean => {
  if (!header) {
    return false;
  }

  const resultCode = toNonEmptyString(header.resultCode);
  const resultMsg = toNonEmptyString(header.resultMsg);

  return resultCode === '03' || resultMsg?.includes('NODATA_ERROR') === true;
};
