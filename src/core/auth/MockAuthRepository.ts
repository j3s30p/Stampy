import type { AuthRepository, UserIdentity } from './AuthRepository';

export class MockAuthRepository implements AuthRepository {
  private user: UserIdentity | null = null;

  async currentUser(): Promise<UserIdentity | null> {
    return this.user;
  }

  async signInAnonymously(): Promise<UserIdentity> {
    this.user = { id: 'mock-user-1', nickname: '스탬피 테스터' };
    return this.user;
  }

  async signOut(): Promise<void> {
    this.user = null;
  }
}
