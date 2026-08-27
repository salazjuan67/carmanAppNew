/**
 * Never autolink OneSignal into the iOS binary.
 * Main-app TurboModule calls were aborting TestFlight (SIGABRT on turbomodule queue).
 * Android keeps the native module.
 */
module.exports = {
  dependencies: {
    'react-native-onesignal': {
      platforms: {
        ios: null,
      },
    },
  },
};
