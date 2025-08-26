module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: [
      // Reanimated plugin은 항상 마지막에 위치해야 함
      "react-native-reanimated/plugin",
    ],
  };
};
