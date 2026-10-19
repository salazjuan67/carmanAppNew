/**
 * Expo config — definitive iOS TestFlight crash fix:
 * - New Architecture OFF (TurboModule abort)
 * - No onesignal-expo-plugin / no OneSignal SDK on iOS
 * - Stub NSE target (same name EAS signs) without OneSignal frameworks
 * - OneSignal only on Android builds
 */
const appJson = require('./app.json');

const appleTeamId =
  process.env.EXPO_APPLE_TEAM_ID ||
  process.env.APPLE_TEAM_ID ||
  'A33553U39B';

const easPlatform = process.env.EAS_BUILD_PLATFORM; // 'ios' | 'android' | undefined
/**
 * OneSignal deshabilitado en todas las plataformas (crashes nativos en Android/iOS).
 * Android e iOS usan expo-notifications; stub NSE solo en builds iOS.
 */
const useOneSignalPlugin = false;
const useStubNse = easPlatform !== 'android';

const basePlugins = (appJson.expo.plugins || [])
  .filter((p) => !(Array.isArray(p) && p[0] === 'onesignal-expo-plugin'))
  .map((p) => {
    if (Array.isArray(p) && p[0] === 'expo-build-properties') {
      return [
        'expo-build-properties',
        {
          ...(p[1] || {}),
          ios: {
            ...((p[1] && p[1].ios) || {}),
            flipper: false,
            newArchEnabled: false,
          },
          android: {
            ...((p[1] && p[1].android) || {}),
            newArchEnabled: false,
          },
        },
      ];
    }
    // Asegurar background remote notifications en iOS
    if (Array.isArray(p) && p[0] === 'expo-notifications') {
      return [
        'expo-notifications',
        {
          enableBackgroundRemoteNotifications: true,
          ...(p[1] || {}),
        },
      ];
    }
    return p;
  });

const plugins = [];

if (useStubNse) {
  plugins.push([
    './plugins/withStubNotificationServiceExtension',
    { appleTeamId },
  ]);
}

if (useOneSignalPlugin) {
  plugins.push([
    'onesignal-expo-plugin',
    {
      mode: 'production',
      devTeam: appleTeamId,
      disableLocation: true,
    },
  ]);
}

plugins.push(...basePlugins);

module.exports = {
  expo: {
    ...appJson.expo,
    scheme: appJson.expo.scheme || 'carman',
    newArchEnabled: false,
    ios: {
      ...appJson.expo.ios,
      appleTeamId,
      buildNumber: appJson.expo.ios.buildNumber || '1',
    },
    plugins,
  },
};
