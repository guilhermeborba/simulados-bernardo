import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "Simulados Bernardo · Prova",
  slug: "simulados-bernardo-mobile-proof",
  version: "0.0.1",
  scheme: "simuladosbernardoproof",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.simuladosbernardo.proof",
  },
  android: { package: "com.simuladosbernardo.proof" },
  plugins: [
    "expo-router",
    ["expo-secure-store", { configureAndroidBackup: true }],
    [
      "expo-audio",
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundRecording: false,
        enableBackgroundPlayback: false,
      },
    ],
  ],
  experiments: { typedRoutes: true },
};
export default config;
