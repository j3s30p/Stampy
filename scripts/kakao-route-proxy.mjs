import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';

const DEFAULT_PORT = 8787;
const DEFAULT_HOST = '127.0.0.1';
const MAX_BODY_BYTES = 1024 * 1024;
const KAKAO_DIRECTIONS_ENDPOINT = 'https://apis-navi.kakaomobility.com/v1/directions';

loadDotEnv();

const port = parsePort(process.env.MAP_ROUTE_PROXY_PORT) ?? DEFAULT_PORT;
const host = firstNonEmptyEnvValue(process.env.MAP_ROUTE_PROXY_HOST) ?? DEFAULT_HOST;
const kakaoRestApiKey = firstNonEmptyEnvValue(
  process.env.KAKAO_REST_API_KEY,
  process.env.EXPO_PUBLIC_KAKAO_API_KEY,
);

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

server.listen(port, host, () => {
  console.info(`Kakao route proxy listening on http://${host}:${port}/map-route`);
});

async function handleRequest(request, response) {
  if (request.method === 'OPTIONS') {
    writeResponse(response, 204, '');
    return;
  }

  if (request.method !== 'POST' || request.url !== '/map-route') {
    writeJson(response, 404, { error: 'Not found' });
    return;
  }

  let payload;

  try {
    payload = await readJsonBody(request);
  } catch (error) {
    writeJson(response, 400, { error: error.message });
    return;
  }

  const routeRequest = parseRouteRequest(payload);

  if (!routeRequest.ok) {
    writeJson(response, 400, { error: routeRequest.error });
    return;
  }

  if (!kakaoRestApiKey) {
    writeJson(response, 500, { error: 'Missing KAKAO_REST_API_KEY' });
    return;
  }

  const kakaoUrl = new URL(KAKAO_DIRECTIONS_ENDPOINT);
  kakaoUrl.searchParams.set(
    'origin',
    `${routeRequest.origin.longitude},${routeRequest.origin.latitude}`,
  );
  kakaoUrl.searchParams.set(
    'destination',
    `${routeRequest.destination.longitude},${routeRequest.destination.latitude}`,
  );

  try {
    const kakaoResponse = await fetch(kakaoUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `KakaoAK ${kakaoRestApiKey}`,
      },
    });
    const responseBody = await kakaoResponse.text();

    writeResponse(response, kakaoResponse.status, responseBody, {
      'Content-Type': kakaoResponse.headers.get('content-type') ?? 'application/json',
    });
  } catch {
    writeJson(response, 502, { error: 'Failed to reach Kakao Mobility directions API' });
  }
}

function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = '';
    let bodyBytes = 0;

    request.setEncoding('utf8');

    request.on('data', (chunk) => {
      bodyBytes += Buffer.byteLength(chunk);

      if (bodyBytes > MAX_BODY_BYTES) {
        rejectBody(new Error('Request body is too large'));
        request.destroy();
        return;
      }

      body += chunk;
    });

    request.on('end', () => {
      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error('Request body must be valid JSON'));
      }
    });

    request.on('error', () => {
      rejectBody(new Error('Failed to read request body'));
    });
  });
}

function parseRouteRequest(value) {
  if (!value || typeof value !== 'object') {
    return { ok: false, error: 'Request body must be an object' };
  }

  const origin = value.origin;
  const destinationLocation = value.destination?.location;

  if (!isCoordinateLike(origin)) {
    return { ok: false, error: 'origin.latitude and origin.longitude must be finite numbers' };
  }

  if (!isCoordinateLike(destinationLocation)) {
    return {
      ok: false,
      error:
        'destination.location.latitude and destination.location.longitude must be finite numbers',
    };
  }

  return {
    ok: true,
    origin: {
      latitude: origin.latitude,
      longitude: origin.longitude,
    },
    destination: {
      latitude: destinationLocation.latitude,
      longitude: destinationLocation.longitude,
    },
  };
}

function isCoordinateLike(value) {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude)
  );
}

function writeJson(response, statusCode, payload) {
  writeResponse(response, statusCode, JSON.stringify(payload), {
    'Content-Type': 'application/json',
  });
}

function writeResponse(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    ...headers,
  });
  response.end(body);
}

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  let envText;

  try {
    envText = readFileSync(envPath, 'utf8');
  } catch {
    return;
  }

  envText.split(/\r?\n/).forEach((line) => {
    const assignment = parseDotEnvLine(line);

    if (!assignment || process.env[assignment.key] !== undefined) {
      return;
    }

    process.env[assignment.key] = assignment.value;
  });
}

function parseDotEnvLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const withoutExport = trimmed.startsWith('export ')
    ? trimmed.slice('export '.length).trim()
    : trimmed;
  const separatorIndex = withoutExport.indexOf('=');

  if (separatorIndex === -1) {
    return null;
  }

  const key = withoutExport.slice(0, separatorIndex).trim();
  const rawValue = withoutExport.slice(separatorIndex + 1).trim();

  if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
    return null;
  }

  return {
    key,
    value: stripEnvQuotes(rawValue),
  };
}

function stripEnvQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parsePort(value) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : null;
}

function firstNonEmptyEnvValue(...values) {
  return values.map((value) => value?.trim()).find(Boolean);
}
