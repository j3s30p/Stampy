import Constants from 'expo-constants';

interface AppEnv {
  readonly tourApiKey: string;
  readonly kakaoJsKey: string;
  readonly useRealApi: boolean;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppEnv>;
const normalizeEnvValue = (value: string | undefined): string => {
  const trimmed = value?.trim() ?? '';

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const parseEnvBoolean = (value: unknown): boolean => {
  return normalizeEnvValue(String(value)).toLowerCase() === 'true';
};

export const env: AppEnv = {
  tourApiKey: normalizeEnvValue(extra.tourApiKey ?? process.env.EXPO_PUBLIC_TOUR_API_KEY),
  kakaoJsKey: normalizeEnvValue(extra.kakaoJsKey ?? process.env.EXPO_PUBLIC_KAKAO_JS_KEY),
  useRealApi: parseEnvBoolean(extra.useRealApi ?? process.env.EXPO_PUBLIC_USE_REAL_API),
};
