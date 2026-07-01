module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxRuntime: 'automatic',
        }
      ]
    ],
    plugins: [
      'react-native-reanimated/plugin', // Keeps Reanimated happy and runs at the very end
    ],
  };
};