export interface HttpClient {
  get<T>(path: string, params?: Record<string, string | number>): Promise<T>;
}
