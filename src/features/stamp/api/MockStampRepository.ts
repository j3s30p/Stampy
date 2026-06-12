import type { StorageRepository } from '@core/storage';
import { collectedStampFixtures } from '@shared/mocks';
import { asLatitude, asLongitude, type Latitude, type Longitude } from '@shared/types';
import type { Stamp } from '../model';
import type { StampRepository } from './StampRepository';

interface StoredStamp {
  readonly id: string;
  readonly spotId: string;
  readonly collectedAt: string;
  readonly location: {
    readonly latitude: Latitude;
    readonly longitude: Longitude;
  };
}

interface StoredStampCollection {
  readonly version: 1;
  readonly stamps: readonly StoredStamp[];
}

const stampCollectionKey = (userId: string) => `stampy:stamps:${userId}`;

export class MockStampRepository implements StampRepository {
  constructor(private readonly storageRepository: StorageRepository) {}

  async listCollected(userId: string): Promise<Stamp[]> {
    const collection = await this.loadCollection(userId);
    return collection.stamps.map(toStamp);
  }

  async collect(userId: string, stamp: Omit<Stamp, 'id' | 'collectedAt'>): Promise<Stamp> {
    const collection = await this.loadCollection(userId);
    const existingStamp = collection.stamps.find((item) => item.spotId === stamp.spotId);

    if (existingStamp) {
      return toStamp(existingStamp);
    }

    const savedStamp: Stamp = {
      ...stamp,
      id: `stamp-${stamp.spotId}`,
      collectedAt: new Date().toISOString(),
    };
    const nextCollection: StoredStampCollection = {
      version: 1,
      stamps: [...collection.stamps, toStoredStamp(savedStamp)],
    };

    await this.storageRepository.set(stampCollectionKey(userId), nextCollection);
    return savedStamp;
  }

  async hasCollected(userId: string, spotId: string): Promise<boolean> {
    return (await this.listCollected(userId)).some((stamp) => stamp.spotId === spotId);
  }

  private async loadCollection(userId: string): Promise<StoredStampCollection> {
    const storedCollection = await this.storageRepository.get<StoredStampCollection>(
      stampCollectionKey(userId),
    );

    if (storedCollection) {
      return storedCollection;
    }

    const seededCollection: StoredStampCollection = {
      version: 1,
      stamps: collectedStampFixtures.map(toStoredStamp),
    };

    await this.storageRepository.set(stampCollectionKey(userId), seededCollection);
    return seededCollection;
  }
}

const toStamp = (storedStamp: StoredStamp): Stamp => ({
  id: storedStamp.id,
  spotId: storedStamp.spotId,
  collectedAt: storedStamp.collectedAt,
  location: {
    latitude: asLatitude(storedStamp.location.latitude),
    longitude: asLongitude(storedStamp.location.longitude),
  },
});

const toStoredStamp = (stamp: Stamp): StoredStamp => ({
  id: stamp.id,
  spotId: stamp.spotId,
  collectedAt: stamp.collectedAt,
  location: {
    latitude: stamp.location.latitude,
    longitude: stamp.location.longitude,
  },
});
