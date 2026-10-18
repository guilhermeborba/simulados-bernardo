import type { ExpoConfig } from "expo/config";
import { buildEnvironment } from "./config/build-environment.cjs";
const environment = buildEnvironment(process.env);
const config: ExpoConfig = {
  name: environment.name,
  slug: "simulados-bernardo",
  owner: "guilhermesborbas-team",
  extra: { eas: { projectId: "d03c6091-0858-4150-9de5-ae051ed5f83a" } },
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
