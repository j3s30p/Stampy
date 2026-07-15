import { deepStrictEqual, equal, match } from 'node:assert/strict';

import { createSyncStampSpotsHandler, type SyncStampSpotsConfig } from './handler.ts';

const SYNC_TOKEN = 'stampy-sync-token-that-is-at-least-32-characters';
const CONFIG: SyncStampSpotsConfig = {
  stampSpotSyncToken: SYNC_TOKEN,
  tourApiServiceKey: 'decoded+/service=key',
  supabaseUrl: 'https://stampy.supabase.co',
  supabaseServiceRoleKey: 'service-role-key',
};

const resolvedResponse = (response: Response): Promise<Response> => Promise.resolve(response);

const createPayloadRequest = (payload: unknown, token = SYNC_TOKEN): Request => {
  return new Request('https://stampy.supabase.co/functions/v1/sync-stamp-spots', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

const createRequest = (contentIds: unknown, token = SYNC_TOKEN): Request =>
  createPayloadRequest({ contentIds }, token);

const createNearbyRequest = (nearby: unknown, token = SYNC_TOKEN): Request =>
  createPayloadRequest({ nearby }, token);

const tourApiResponse = (
  contentId: string,
  overrides: Record<string, unknown> = {},
  options: { readonly resultCode?: string; readonly itemAsObject?: boolean } = {},
): Response => {
  const item = {
    contentid: contentId,
    contenttypeid: '12',
    title: '경복궁',
    mapx: '126.977041',
    mapy: '37.579617',
    lDongRegnCd: '11',
    lDongSignguCd: '110',
    ...overrides,
  };

  return Response.json({
    response: {
      header: {
        resultCode: options.resultCode ?? '0000',
        resultMsg: 'OK',
      },
      body: {
        items: {
          item: options.itemAsObject ? item : [item],
        },
        totalCount: 1,
      },
    },
  });
};

const locationBasedResponse = (
  contentIds: readonly unknown[],
  resultCode = '0000',
): Response => {
  return Response.json({
    response: {
      header: {
        resultCode,
        resultMsg: 'OK',
      },
      body: {
        items: contentIds.length === 0
          ? ''
          : { item: contentIds.map((contentid) => ({ contentid })) },
        totalCount: contentIds.length,
      },
    },
  });
};

Deno.test('syncs a validated TourAPI spot with longitude before latitude', async () => {
  const requests: Request[] = [];
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    requests.push(request);

    if (new URL(request.url).hostname === 'apis.data.go.kr') {
      return resolvedResponse(tourApiResponse('126508'));
    }

    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createRequest(['126508']),
  );

  equal(response.status, 200);
  deepStrictEqual(await response.json(), {
    syncedCount: 1,
    contentIds: ['126508'],
  });
  equal(requests.length, 2);

  const tourUrl = new URL(requests[0].url);
  equal(tourUrl.pathname, '/B551011/KorService2/detailCommon2');
  equal(tourUrl.searchParams.get('serviceKey'), CONFIG.tourApiServiceKey);
  match(tourUrl.search, /serviceKey=decoded%2B%2Fservice%3Dkey/);
  equal(tourUrl.searchParams.get('MobileOS'), 'ETC');
  equal(tourUrl.searchParams.get('MobileApp'), 'Stampy');
  equal(tourUrl.searchParams.get('_type'), 'json');
  equal(tourUrl.searchParams.get('contentId'), '126508');

  const databaseRequest = requests[1];
  equal(databaseRequest.method, 'POST');
  equal(new URL(databaseRequest.url).pathname, '/rest/v1/stamp_spots');
  equal(new URL(databaseRequest.url).searchParams.get('on_conflict'), 'content_id');
  equal(databaseRequest.headers.get('apikey'), CONFIG.supabaseServiceRoleKey);
  equal(
    databaseRequest.headers.get('authorization'),
    `Bearer ${CONFIG.supabaseServiceRoleKey}`,
  );
  equal(
    databaseRequest.headers.get('prefer'),
    'resolution=merge-duplicates,return=minimal',
  );
  deepStrictEqual(await databaseRequest.json(), [
    {
      content_id: '126508',
      title: '경복궁',
      kind: 'spot',
      location: 'SRID=4326;POINT(126.977041 37.579617)',
      ldong_region_code: '11',
      ldong_sigungu_code: '110',
    },
  ]);
});

Deno.test('maps content type 15 to event and accepts the documented object item shape', async () => {
  const databaseRequests: Request[] = [];
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);

    if (new URL(request.url).hostname === 'apis.data.go.kr') {
      return resolvedResponse(
        tourApiResponse(
          '2752618',
          { contenttypeid: '15', title: '서울 축제' },
          { itemAsObject: true },
        ),
      );
    }

    databaseRequests.push(request);
    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createRequest(['2752618']),
  );

  equal(response.status, 200);
  equal(databaseRequests.length, 1);
  deepStrictEqual(await databaseRequests[0].json(), [
    {
      content_id: '2752618',
      title: '서울 축제',
      kind: 'event',
      location: 'SRID=4326;POINT(126.977041 37.579617)',
      ldong_region_code: '11',
      ldong_sigungu_code: '110',
    },
  ]);
});

Deno.test('writes an explicit null pair when TourAPI omits either legal district code', async () => {
  for (
    const overrides of [
      { lDongRegnCd: '', lDongSignguCd: '' },
      { lDongRegnCd: '11', lDongSignguCd: '' },
    ]
  ) {
    const databaseRequests: Request[] = [];
    const fetcher = (
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      const request = new Request(input, init);
      if (new URL(request.url).hostname === 'apis.data.go.kr') {
        return resolvedResponse(tourApiResponse('126508', overrides));
      }
      databaseRequests.push(request);
      return resolvedResponse(new Response(null, { status: 201 }));
    };

    const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
      createRequest(['126508']),
    );

    equal(response.status, 200);
    equal(databaseRequests.length, 1);
    const rows = await databaseRequests[0].json();
    deepStrictEqual(rows, [
      {
        content_id: '126508',
        title: '경복궁',
        kind: 'spot',
        location: 'SRID=4326;POINT(126.977041 37.579617)',
        ldong_region_code: null,
        ldong_sigungu_code: null,
      },
    ]);
  }
});

Deno.test('discovers nearby content IDs with official coordinate ordering', async () => {
  const requests: Request[] = [];
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    requests.push(request);
    const url = new URL(request.url);

    if (url.pathname.endsWith('/locationBasedList2')) {
      return resolvedResponse(locationBasedResponse(['126508', '126509']));
    }
    if (url.pathname.endsWith('/detailCommon2')) {
      return resolvedResponse(tourApiResponse(url.searchParams.get('contentId') ?? ''));
    }

    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createNearbyRequest({
      latitude: 37.579617,
      longitude: 126.977041,
      radiusMeters: 1000,
      limit: 2,
    }),
  );

  equal(response.status, 200);
  deepStrictEqual(await response.json(), {
    syncedCount: 2,
    contentIds: ['126508', '126509'],
  });
  equal(requests.length, 4);

  const discoveryUrl = new URL(requests[0].url);
  equal(discoveryUrl.pathname, '/B551011/KorService2/locationBasedList2');
  equal(discoveryUrl.searchParams.get('serviceKey'), CONFIG.tourApiServiceKey);
  match(discoveryUrl.search, /serviceKey=decoded%2B%2Fservice%3Dkey/);
  equal(discoveryUrl.searchParams.get('MobileOS'), 'ETC');
  equal(discoveryUrl.searchParams.get('MobileApp'), 'Stampy');
  equal(discoveryUrl.searchParams.get('_type'), 'json');
  equal(discoveryUrl.searchParams.get('mapX'), '126.977041');
  equal(discoveryUrl.searchParams.get('mapY'), '37.579617');
  equal(discoveryUrl.searchParams.get('radius'), '1000');
  equal(discoveryUrl.searchParams.get('numOfRows'), '2');
  equal(discoveryUrl.searchParams.get('pageNo'), '1');
  equal(discoveryUrl.searchParams.get('arrange'), 'E');

  const detailIds = requests
    .filter((request) => new URL(request.url).pathname.endsWith('/detailCommon2'))
    .map((request) => new URL(request.url).searchParams.get('contentId'));
  deepStrictEqual(detailIds, ['126508', '126509']);
  equal(new URL(requests[3].url).pathname, '/rest/v1/stamp_spots');
});

Deno.test('requires exactly one sync request mode before external calls', async () => {
  let calls = 0;
  const fetcher = (): Promise<Response> => {
    calls += 1;
    return resolvedResponse(new Response(null, { status: 500 }));
  };
  const handler = createSyncStampSpotsHandler(CONFIG, fetcher);
  const nearby = {
    latitude: 37.579617,
    longitude: 126.977041,
    radiusMeters: 1000,
    limit: 5,
  };

  for (const payload of [{}, { contentIds: ['126508'], nearby }]) {
    const response = await handler(createPayloadRequest(payload));
    equal(response.status, 400);
    deepStrictEqual(await response.json(), { error: 'invalid_request' });
  }

  equal(calls, 0);
});

Deno.test('rejects invalid nearby bounds before external calls', async () => {
  let calls = 0;
  const fetcher = (): Promise<Response> => {
    calls += 1;
    return resolvedResponse(new Response(null, { status: 500 }));
  };
  const handler = createSyncStampSpotsHandler(CONFIG, fetcher);
  const valid = {
    latitude: 37.579617,
    longitude: 126.977041,
    radiusMeters: 1000,
    limit: 5,
  };
  const invalidNearby = [
    null,
    { ...valid, latitude: 91 },
    { ...valid, longitude: -181 },
    { ...valid, radiusMeters: 0 },
    { ...valid, radiusMeters: 20_001 },
    { ...valid, radiusMeters: 1.5 },
    { ...valid, limit: 0 },
    { ...valid, limit: 21 },
    { ...valid, limit: 1.5 },
  ];

  for (const nearby of invalidNearby) {
    const response = await handler(createNearbyRequest(nearby));
    equal(response.status, 400);
    deepStrictEqual(await response.json(), { error: 'invalid_nearby' });
  }

  const nonFinite = new Request(
    'https://stampy.supabase.co/functions/v1/sync-stamp-spots',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${SYNC_TOKEN}`,
        'content-type': 'application/json',
      },
      body: '{"nearby":{"latitude":1e400,"longitude":126.977041,"radiusMeters":1000,"limit":5}}',
    },
  );
  const nonFiniteResponse = await handler(nonFinite);
  equal(nonFiniteResponse.status, 400);
  deepStrictEqual(await nonFiniteResponse.json(), { error: 'invalid_nearby' });
  equal(calls, 0);
});

Deno.test('deduplicates and caps discovered content IDs to the requested limit', async () => {
  const detailIds: string[] = [];
  let databaseCalls = 0;
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    if (url.pathname.endsWith('/locationBasedList2')) {
      return resolvedResponse(
        locationBasedResponse(['126508', '126508', 126509, '126510']),
      );
    }
    if (url.pathname.endsWith('/detailCommon2')) {
      const contentId = url.searchParams.get('contentId') ?? '';
      detailIds.push(contentId);
      return resolvedResponse(tourApiResponse(contentId));
    }

    databaseCalls += 1;
    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createNearbyRequest({
      latitude: 37.579617,
      longitude: 126.977041,
      radiusMeters: 20_000,
      limit: 2,
    }),
  );

  equal(response.status, 200);
  deepStrictEqual(await response.json(), {
    syncedCount: 2,
    contentIds: ['126508', '126509'],
  });
  deepStrictEqual(detailIds, ['126508', '126509']);
  equal(databaseCalls, 1);
});

Deno.test('returns a safe not-found error for an empty nearby result', async () => {
  let calls = 0;
  const fetcher = (): Promise<Response> => {
    calls += 1;
    return resolvedResponse(locationBasedResponse([]));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createNearbyRequest({
      latitude: 37.579617,
      longitude: 126.977041,
      radiusMeters: 1000,
      limit: 5,
    }),
  );

  equal(response.status, 404);
  deepStrictEqual(await response.json(), { error: 'nearby_content_not_found' });
  equal(calls, 1);
});

Deno.test('returns safe errors for unavailable or invalid nearby responses', async () => {
  const upstreamCases: readonly {
    readonly response: () => Response;
    readonly error: string;
  }[] = [
    {
      response: () => new Response(null, { status: 503 }),
      error: 'tour_api_unavailable',
    },
    {
      response: () => locationBasedResponse(['126508'], '03'),
      error: 'tour_api_invalid_response',
    },
    {
      response: () => locationBasedResponse(['not-a-content-id']),
      error: 'tour_api_invalid_response',
    },
    {
      response: () => new Response('<OpenAPI_ServiceResponse />'),
      error: 'tour_api_invalid_response',
    },
  ];

  for (const upstreamCase of upstreamCases) {
    let calls = 0;
    const fetcher = (): Promise<Response> => {
      calls += 1;
      return resolvedResponse(upstreamCase.response());
    };
    const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
      createNearbyRequest({
        latitude: 37.579617,
        longitude: 126.977041,
        radiusMeters: 1000,
        limit: 5,
      }),
    );

    equal(response.status, 502);
    deepStrictEqual(await response.json(), { error: upstreamCase.error });
    equal(calls, 1);
  }
});

Deno.test('does not write nearby catalog rows when a detail lookup fails', async () => {
  let databaseCalls = 0;
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    if (url.pathname.endsWith('/locationBasedList2')) {
      return resolvedResponse(locationBasedResponse(['126508', '126509']));
    }
    if (url.pathname.endsWith('/detailCommon2')) {
      const contentId = url.searchParams.get('contentId') ?? '';
      return resolvedResponse(
        tourApiResponse(contentId, {}, { resultCode: contentId === '126508' ? '0000' : '03' }),
      );
    }

    databaseCalls += 1;
    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createNearbyRequest({
      latitude: 37.579617,
      longitude: 126.977041,
      radiusMeters: 1000,
      limit: 2,
    }),
  );

  equal(response.status, 502);
  deepStrictEqual(await response.json(), { error: 'tour_api_invalid_response' });
  equal(databaseCalls, 0);
});

Deno.test('deduplicates repeated content IDs before calling TourAPI', async () => {
  let tourApiCalls = 0;
  let databaseCalls = 0;
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);

    if (new URL(request.url).hostname === 'apis.data.go.kr') {
      tourApiCalls += 1;
      return resolvedResponse(tourApiResponse('126508'));
    }

    databaseCalls += 1;
    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createRequest(['126508', '126508']),
  );

  equal(response.status, 200);
  equal(tourApiCalls, 1);
  equal(databaseCalls, 1);
});

Deno.test('rejects missing or incorrect sync credentials before external calls', async () => {
  let calls = 0;
  const fetcher = (): Promise<Response> => {
    calls += 1;
    return resolvedResponse(new Response(null, { status: 500 }));
  };
  const handler = createSyncStampSpotsHandler(CONFIG, fetcher);
  const missing = createRequest(['126508']);
  missing.headers.delete('authorization');
  const malformed = new Request(
    'https://stampy.supabase.co/functions/v1/sync-stamp-spots',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    },
  );

  equal((await handler(missing)).status, 401);
  equal((await handler(malformed)).status, 401);
  equal((await handler(createRequest(['126508'], 'ordinary-user-jwt'))).status, 401);
  equal(calls, 0);
});

Deno.test('rejects invalid content ID request shapes before external calls', async () => {
  let calls = 0;
  const fetcher = (): Promise<Response> => {
    calls += 1;
    return resolvedResponse(new Response(null, { status: 500 }));
  };
  const handler = createSyncStampSpotsHandler(CONFIG, fetcher);
  const cases: readonly unknown[] = [[], [126508], [''], ['tour-126508'], Array(21).fill('1')];

  for (const contentIds of cases) {
    const response = await handler(createRequest(contentIds));
    equal(response.status, 400);
  }

  equal(calls, 0);
});

Deno.test('does not write a partial catalog when any TourAPI item fails validation', async () => {
  let databaseCalls = 0;
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    if (url.hostname === 'apis.data.go.kr') {
      const contentId = url.searchParams.get('contentId') ?? '';
      return resolvedResponse(
        contentId === '126508'
          ? tourApiResponse(contentId)
          : tourApiResponse(contentId, {}, { resultCode: '03' }),
      );
    }

    databaseCalls += 1;
    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createRequest(['126508', '999999']),
  );

  equal(response.status, 502);
  deepStrictEqual(await response.json(), { error: 'tour_api_invalid_response' });
  equal(databaseCalls, 0);
});

Deno.test('rejects blank and out-of-range TourAPI coordinates', async () => {
  const invalidCoordinates: readonly Record<string, unknown>[] = [
    { mapx: '' },
    { mapy: '91' },
    { mapx: 'Infinity' },
  ];

  for (const overrides of invalidCoordinates) {
    let databaseCalls = 0;
    const fetcher = (
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      const request = new Request(input, init);

      if (new URL(request.url).hostname === 'apis.data.go.kr') {
        return resolvedResponse(tourApiResponse('126508', overrides));
      }

      databaseCalls += 1;
      return resolvedResponse(new Response(null, { status: 201 }));
    };
    const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
      createRequest(['126508']),
    );

    equal(response.status, 502);
    equal(databaseCalls, 0);
  }
});

Deno.test('rejects non-numeric TourAPI legal district codes', async () => {
  for (
    const overrides of [
      { lDongRegnCd: '서울' },
      { lDongSignguCd: '110.0' },
      { lDongRegnCd: { code: '11' } },
      { lDongSignguCd: true },
    ]
  ) {
    let databaseCalls = 0;
    const fetcher = (
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      const request = new Request(input, init);
      if (new URL(request.url).hostname === 'apis.data.go.kr') {
        return resolvedResponse(tourApiResponse('126508', overrides));
      }
      databaseCalls += 1;
      return resolvedResponse(new Response(null, { status: 201 }));
    };

    const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
      createRequest(['126508']),
    );

    equal(response.status, 502);
    deepStrictEqual(await response.json(), { error: 'tour_api_invalid_response' });
    equal(databaseCalls, 0);
  }
});

Deno.test('rejects a mismatched TourAPI content ID and unsupported content type', async () => {
  const invalidItems: readonly Record<string, unknown>[] = [
    { contentid: '999999' },
    { contenttypeid: '999' },
  ];

  for (const overrides of invalidItems) {
    const fetcher = (
      input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      const request = new Request(input, init);
      return resolvedResponse(
        new URL(request.url).hostname === 'apis.data.go.kr'
          ? tourApiResponse('126508', overrides)
          : new Response(null, { status: 201 }),
      );
    };
    const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
      createRequest(['126508']),
    );

    equal(response.status, 502);
  }
});

Deno.test('rejects non-JSON TourAPI responses even when the HTTP status is 200', async () => {
  let databaseCalls = 0;
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);

    if (new URL(request.url).hostname === 'apis.data.go.kr') {
      return resolvedResponse(
        new Response('<OpenAPI_ServiceResponse />', {
          status: 200,
          headers: { 'content-type': 'application/xml' },
        }),
      );
    }

    databaseCalls += 1;
    return resolvedResponse(new Response(null, { status: 201 }));
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createRequest(['126508']),
  );

  equal(response.status, 502);
  equal(databaseCalls, 0);
});

Deno.test('returns a safe error when the catalog upsert fails', async () => {
  const fetcher = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    return resolvedResponse(
      new URL(request.url).hostname === 'apis.data.go.kr'
        ? tourApiResponse('126508')
        : Response.json({ message: 'sensitive database detail' }, { status: 500 }),
    );
  };
  const response = await createSyncStampSpotsHandler(CONFIG, fetcher)(
    createRequest(['126508']),
  );

  equal(response.status, 500);
  deepStrictEqual(await response.json(), { error: 'catalog_write_failed' });
});

Deno.test('allows only POST requests', async () => {
  const response = await createSyncStampSpotsHandler(CONFIG)(
    new Request('https://stampy.supabase.co/functions/v1/sync-stamp-spots'),
  );

  equal(response.status, 405);
  equal(response.headers.get('allow'), 'POST');
});
