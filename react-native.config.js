/**
 * Never autolink OneSignal — native module crashes on Android and iOS startup.
 * Push via expo-notifications only until OneSignal is re-enabled deliberately.
 */
module.exports = {
  dependencies: {
    'react-native-onesignal': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};
