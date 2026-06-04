module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@app': './app',
            '@features': './src/features',
            '@core': './src/core',
            '@shared': './src/shared',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
