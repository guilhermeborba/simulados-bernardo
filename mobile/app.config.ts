import type { ExpoConfig } from "expo/config";
import { buildEnvironment } from "./config/build-environment.cjs";
const environment = buildEnvironment(process.env);
const config: ExpoConfig = {
  name: environment.name,
  slug: "giz-kids-development",
  version: "0.0.1",
  icon: "./assets/icon.png",
  scheme: environment.scheme,
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: environment.identifier,
  },
  android: { package: environment.identifier },
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
