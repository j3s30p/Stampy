import Constants from 'expo-constants';

interface AppEnv {
  readonly tourApiKey: string;
  readonly kakaoJsKey: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppEnv>;

export const env: AppEnv = {
  tourApiKey: extra.tourApiKey ?? process.env.EXPO_PUBLIC_TOUR_API_KEY ?? '',
  kakaoJsKey: extra.kakaoJsKey ?? process.env.EXPO_PUBLIC_KAKAO_JS_KEY ?? '',
};
