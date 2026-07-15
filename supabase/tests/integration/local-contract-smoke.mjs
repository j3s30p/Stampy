import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const status = await readStatusFromStdin();
const apiUrl = status.API_URL;
const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
const serviceRoleKey = status.SERVICE_ROLE_KEY;

assert(apiUrl, 'Supabase status is missing API_URL.');
assert(publicKey, 'Supabase status is missing PUBLISHABLE_KEY or ANON_KEY.');
assert(serviceRoleKey, 'Supabase status is missing SERVICE_ROLE_KEY.');

assertLocalApiUrl(apiUrl);

const fixture = {
  content_id: `local-contract-smoke-${randomUUID()}`,
  title: '로컬 계약 smoke 장소',
  kind: 'spot',
  latitude: -48.876543,
  longitude: -123.456789,
  ldongRegionCode: '11',
  ldongSigunguCode: '11110',
};
const createdUserIds = [];
let failure;

try {
  await serviceRequest('/rest/v1/stamp_spots', {
    label: 'fixture insert',
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: {
      content_id: fixture.content_id,
      title: fixture.title,
      kind: fixture.kind,
      location: `SRID=4326;POINT(${fixture.longitude} ${fixture.latitude})`,
      ldong_region_code: fixture.ldongRegionCode,
      ldong_sigungu_code: fixture.ldongSigunguCode,
    },
  });

  const userA = await createConfirmedUser('A');
  const userB = await createConfirmedUser('B');

  const spots = await authenticatedRpc(userA.accessToken, 'list_stamp_spots');
  const listedFixture = spots.find((spot) => spot.content_id === fixture.content_id);
  assert(listedFixture, 'catalog does not contain the test fixture');
  assert(
    listedFixture.latitude === fixture.latitude && listedFixture.longitude === fixture.longitude,
    'catalog changed the fixture coordinate order',
  );

  const recommendationA = await recommendationFor(userA.accessToken);
  assertSingleFixture(recommendationA, 'user A recommendation');

  const collection = await authenticatedRpc(userA.accessToken, 'collect_stamp', {
    p_content_id: fixture.content_id,
    p_latitude: fixture.latitude,
    p_longitude: fixture.longitude,
    p_accuracy_meters: 5,
    p_verification_timestamp: new Date().toISOString(),
  });
  assert(
    collection.length === 1 &&
      collection[0].result === 'success' &&
      collection[0].content_id === fixture.content_id,
    'user A collection did not return the success contract',
  );

  const collectedA = await authenticatedRpc(userA.accessToken, 'list_collected_stamps');
  assertSingleFixture(collectedA, 'user A collected list');

  const sigunguCountA = await authenticatedRpc(userA.accessToken, 'get_collected_sigungu_count');
  assert(sigunguCountA === 1, 'user A collected sigungu count is not one');

  const weeklyRankingA = await authenticatedRpc(userA.accessToken, 'list_weekly_ranking');
  assertWeeklyRanking(weeklyRankingA, true, 'user A weekly ranking');

  const directA = await authenticatedRequest(
    userA.accessToken,
    `/rest/v1/collected_stamps?select=content_id&content_id=eq.${encodeURIComponent(fixture.content_id)}`,
    { label: 'user A direct collection read', method: 'GET' },
  );
  assertSingleFixture(directA, 'user A direct collection read');

  const collectedB = await authenticatedRpc(userB.accessToken, 'list_collected_stamps');
  assert(collectedB.length === 0, 'user B can see user A collected RPC rows');

  const sigunguCountB = await authenticatedRpc(userB.accessToken, 'get_collected_sigungu_count');
  assert(sigunguCountB === 0, 'user B collected sigungu count is not zero');

  const weeklyRankingB = await authenticatedRpc(userB.accessToken, 'list_weekly_ranking');
  assertWeeklyRanking(weeklyRankingB, false, 'user B weekly ranking');

  const directB = await authenticatedRequest(
    userB.accessToken,
    `/rest/v1/collected_stamps?select=content_id&content_id=eq.${encodeURIComponent(fixture.content_id)}`,
    { label: 'user B direct collection read', method: 'GET' },
  );
  assert(directB.length === 0, 'user B can see user A direct table rows');

  const recommendationB = await recommendationFor(userB.accessToken);
  assertSingleFixture(recommendationB, 'user B recommendation');

  console.log('Supabase local Auth-to-RPC contract smoke passed.');
} catch (error) {
  failure = error;
}

const cleanupErrors = [];
for (const userId of createdUserIds.reverse()) {
  try {
    await serviceRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      label: 'member user cleanup',
      method: 'DELETE',
    });
  } catch (error) {
    cleanupErrors.push(error);
  }
}

try {
  await serviceRequest(
    `/rest/v1/stamp_spots?content_id=eq.${encodeURIComponent(fixture.content_id)}`,
    {
      label: 'fixture cleanup',
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    },
  );
} catch (error) {
  cleanupErrors.push(error);
}

if (failure || cleanupErrors.length > 0) {
  throw new AggregateError(
    [failure, ...cleanupErrors].filter(Boolean),
    'Supabase local contract smoke failed.',
  );
}

async function createConfirmedUser(label) {
  const email = `stampy-contract-${label.toLowerCase()}-${randomUUID()}@example.invalid`;
  const password = `Smoke-${randomUUID()}-A9!`;
  const created = await serviceRequest('/auth/v1/admin/users', {
    label: `member creation ${label}`,
    method: 'POST',
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: { contract_smoke: true },
    },
  });
  const createdUser = created?.user ?? created;
  assert(createdUser?.id, `member creation ${label} returned no user id`);
  createdUserIds.push(createdUser.id);

  const response = await request('/auth/v1/token?grant_type=password', {
    label: `member sign-in ${label}`,
    method: 'POST',
    apiKey: publicKey,
    accessToken: publicKey,
    body: { email, password },
  });
  assert(
    response?.access_token && response?.user?.id,
    `member sign-in ${label} returned an incomplete session`,
  );
  assert(
    response.user.id === createdUser.id && response.user.is_anonymous !== true,
    `member sign-in ${label} did not return the created member`,
  );
  return { accessToken: response.access_token };
}

function authenticatedRpc(accessToken, functionName, body = {}) {
  return authenticatedRequest(accessToken, `/rest/v1/rpc/${functionName}`, {
    label: `${functionName} RPC`,
    method: 'POST',
    body,
  });
}

function recommendationFor(accessToken) {
  return authenticatedRpc(accessToken, 'get_stamp_recommendation', {
    p_latitude: fixture.latitude,
    p_longitude: fixture.longitude,
  });
}

function authenticatedRequest(accessToken, path, options) {
  return request(path, {
    ...options,
    apiKey: publicKey,
    accessToken,
  });
}

function serviceRequest(path, options) {
  return request(path, {
    ...options,
    apiKey: serviceRoleKey,
    accessToken: serviceRoleKey,
  });
}

async function request(path, { label, method, apiKey, accessToken, body, headers = {} }) {
  const response = await fetch(new URL(path, apiUrl), {
    method,
    headers: {
      Accept: 'application/json',
      apikey: apiKey,
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}.`);
  }
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} returned a non-JSON response.`);
  }
}

function assertSingleFixture(rows, label) {
  assert(
    Array.isArray(rows) && rows.length === 1 && rows[0].content_id === fixture.content_id,
    `${label} did not return exactly the test fixture`,
  );
}

function assertWeeklyRanking(rows, isCurrentUser, label) {
  assert(Array.isArray(rows) && rows.length === 1, `${label} did not return one row`);
  const [row] = rows;
  assert.deepEqual(
    Object.keys(row).sort(),
    ['is_current_user', 'rank', 'stamp_count'],
    `${label} exposed fields outside the anonymous contract`,
  );
  assert(
    row.rank === 1 && row.stamp_count === 1 && row.is_current_user === isCurrentUser,
    `${label} returned an unexpected rank`,
  );
}

function assertLocalApiUrl(value) {
  const url = new URL(value);
  const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
  if (url.protocol !== 'http:' || !localHosts.has(url.hostname)) {
    throw new Error('Contract smoke only accepts a local HTTP Supabase URL.');
  }
}

async function readStatusFromStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = Buffer.concat(chunks).toString('utf8').trim();
  if (!input) {
    throw new Error('Pipe `supabase status -o json` into this smoke test.');
  }

  try {
    return JSON.parse(input);
  } catch {
    throw new Error('Supabase status input is not valid JSON.');
  }
}
