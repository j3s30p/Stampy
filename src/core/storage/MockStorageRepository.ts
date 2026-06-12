import {
  deleteAsync,
  documentDirectory,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system';
import type { StorageRepository } from './StorageRepository';

type StoredEntries = Record<string, unknown>;

const STORAGE_FILE_NAME = 'stampy-mock-storage.json';
const WEB_STORAGE_KEY = 'stampy:mock-storage';

export class MockStorageRepository implements StorageRepository {
  private readonly store = new Map<string, unknown>();
  private readonly fileUri = documentDirectory ? `${documentDirectory}${STORAGE_FILE_NAME}` : null;
  private readonly webStorage =
    typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  async get<T>(key: string): Promise<T | null> {
    await this.ensureLoaded();
    return (this.store.get(key) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.ensureLoaded();
    this.store.set(key, value);
    await this.persist();
  }

  async remove(key: string): Promise<void> {
    await this.ensureLoaded();
    this.store.delete(key);
    await this.persist();
  }

  private async ensureLoaded() {
    if (this.loaded) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.load();
    }

    await this.loadPromise;
  }

  private async load() {
    const storedEntries = await this.readStoredEntries();

    this.store.clear();
    Object.entries(storedEntries).forEach(([key, value]) => {
      this.store.set(key, value);
    });
    this.loaded = true;
  }

  private async persist() {
    const entries = Object.fromEntries(this.store.entries());

    if (this.fileUri) {
      if (Object.keys(entries).length === 0) {
        await deleteAsync(this.fileUri, { idempotent: true });
        return;
      }

      await writeAsStringAsync(this.fileUri, JSON.stringify(entries));
      return;
    }

    if (this.webStorage) {
      this.webStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(entries));
    }
  }

  private async readStoredEntries(): Promise<StoredEntries> {
    if (this.fileUri) {
      try {
        const raw = await readAsStringAsync(this.fileUri);
        return parseStoredEntries(raw);
      } catch {
        return {};
      }
    }

    if (this.webStorage) {
      return parseStoredEntries(this.webStorage.getItem(WEB_STORAGE_KEY));
    }

    return {};
  }
}

const parseStoredEntries = (value: string | null): StoredEntries => {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as StoredEntries;
    }
  } catch {
    return {};
  }

  return {};
};
