import type { HttpClient } from './httpClient';

export class FetchHttpClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    const response = await fetch(url.toString());
    const bodyText = await response.text();

    if (!response.ok) {
      throw new Error(this.formatHttpError(response.status, response.statusText, bodyText));
    }

    try {
      return JSON.parse(bodyText) as T;
    } catch {
      const xmlMessage = extractXmlErrorMessage(bodyText);

      if (xmlMessage) {
        throw new Error(xmlMessage);
      }

      throw new Error('TourAPI response was not valid JSON.');
    }
  }

  private formatHttpError(status: number, statusText: string, bodyText: string) {
    const xmlMessage = extractXmlErrorMessage(bodyText);

    if (xmlMessage) {
      return `${xmlMessage} (HTTP ${status} ${statusText})`;
    }

    return `HTTP ${status} ${statusText}`;
  }
}

const extractXmlErrorMessage = (bodyText: string): string | null => {
  const trimmed = bodyText.trim();

  if (!trimmed.startsWith('<')) {
    return null;
  }

  const candidates = ['returnAuthMsg', 'returnReasonCode', 'errMsg', 'resultMsg', 'msg'] as const;

  for (const tagName of candidates) {
    const regex = new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'i');
    const match = trimmed.match(regex);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const serviceMatch = trimmed.match(/<message>([^<]+)<\/message>/i);
  if (serviceMatch?.[1]) {
    return serviceMatch[1].trim();
  }

  return null;
};
