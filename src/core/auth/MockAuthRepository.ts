import type { StorageRepository } from '@core/storage';
import type { AuthRepository, UserIdentity } from './AuthRepository';

const CURRENT_USER_KEY = 'stampy:auth:current-user';

export class MockAuthRepository implements AuthRepository {
  constructor(private readonly storageRepository: StorageRepository) {}

  async currentUser(): Promise<UserIdentity | null> {
    return (await this.storageRepository.get<UserIdentity>(CURRENT_USER_KEY)) ?? null;
  }

  async signInAnonymously(): Promise<UserIdentity> {
    const existingUser = await this.currentUser();

    if (existingUser) {
      return existingUser;
    }

    const user: UserIdentity = { id: 'mock-user-1', nickname: '스탬피 테스터' };
    await this.storageRepository.set(CURRENT_USER_KEY, user);
    return user;
  }

  async signOut(): Promise<void> {
    await this.storageRepository.remove(CURRENT_USER_KEY);
  }
}
