export interface UserIdentity {
  readonly id: string;
  readonly nickname: string;
}

export interface AuthRepository {
  currentUser(): Promise<UserIdentity | null>;
  signInAnonymously(): Promise<UserIdentity>;
  signOut(): Promise<void>;
}
