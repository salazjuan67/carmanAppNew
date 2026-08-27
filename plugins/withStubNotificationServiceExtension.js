/**
 * Adds a pass-through Notification Service Extension with the same target/bundle
 * EAS already has credentials for — WITHOUT linking the OneSignal SDK.
 * That keeps signing working while stopping TestFlight TurboModule crashes.
 */
const {
  withXcodeProject,
  withDangerousMod,
  withEntitlementsPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NSE_TARGET_NAME = 'OneSignalNotificationServiceExtension';
const APP_GROUP = 'group.com.carmanapp.baires.onesignal';

function copyStubFiles(iosPath, buildNumber, version) {
  const srcDir = path.join(__dirname, 'stub-nse');
  const destDir = path.join(iosPath, NSE_TARGET_NAME);
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of [
    'NotificationService.swift',
    'OneSignalNotificationServiceExtension.entitlements',
    'OneSignalNotificationServiceExtension-Info.plist',
  ]) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }

  const plistPath = path.join(destDir, 'OneSignalNotificationServiceExtension-Info.plist');
  let plist = fs.readFileSync(plistPath, 'utf8');
  plist = plist
    .replace(/<string>14\.2\.0<\/string>/, `<string>${version}</string>`)
    .replace(/<string>14<\/string>/, `<string>${buildNumber}</string>`);
  fs.writeFileSync(plistPath, plist);
}

function withStubNseFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosPath = path.join(cfg.modRequest.projectRoot, 'ios');
      copyStubFiles(
        iosPath,
        cfg.ios?.buildNumber || '1',
        cfg.version || '1.0.0'
      );
      return cfg;
    },
  ]);
}

function withStubNseXcode(config, appleTeamId) {
  return withXcodeProject(config, (cfg) => {
    const xcodeProject = cfg.modResults;
    if (xcodeProject.pbxTargetByName(NSE_TARGET_NAME)) {
      return cfg;
    }

    const bundleId = `${cfg.ios?.bundleIdentifier}.${NSE_TARGET_NAME}`;
    const groupFiles = [
      'NotificationService.swift',
      'OneSignalNotificationServiceExtension.entitlements',
      'OneSignalNotificationServiceExtension-Info.plist',
    ];

    const extGroup = xcodeProject.addPbxGroup(groupFiles, NSE_TARGET_NAME, NSE_TARGET_NAME);
    const groups = xcodeProject.hash.project.objects.PBXGroup;
    Object.keys(groups).forEach((key) => {
      if (
        typeof groups[key] === 'object' &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    const projObjects = xcodeProject.hash.project.objects;
    projObjects.PBXTargetDependency = projObjects.PBXTargetDependency || {};
    projObjects.PBXContainerItemProxy = projObjects.PBXContainerItemProxy || {};

    const nseTarget = xcodeProject.addTarget(
      NSE_TARGET_NAME,
      'app_extension',
      NSE_TARGET_NAME,
      bundleId
    );

    xcodeProject.addBuildPhase(
      ['NotificationService.swift'],
      'PBXSourcesBuildPhase',
      'Sources',
      nseTarget.uuid
    );
    xcodeProject.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', nseTarget.uuid);
    xcodeProject.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', nseTarget.uuid);

    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const settings = configurations[key].buildSettings;
      if (!settings) continue;
      if (settings.PRODUCT_NAME == `"${NSE_TARGET_NAME}"`) {
        settings.DEVELOPMENT_TEAM = appleTeamId;
        settings.IPHONEOS_DEPLOYMENT_TARGET = '15.1';
        settings.TARGETED_DEVICE_FAMILY = '"1,2"';
        settings.SWIFT_VERSION = '5.0';
        settings.CODE_SIGN_ENTITLEMENTS = `${NSE_TARGET_NAME}/${NSE_TARGET_NAME}.entitlements`;
        settings.CODE_SIGN_STYLE = 'Automatic';
        settings.INFOPLIST_FILE = `${NSE_TARGET_NAME}/${NSE_TARGET_NAME}-Info.plist`;
      }
    }

    xcodeProject.addTargetAttribute('DevelopmentTeam', appleTeamId, nseTarget);
    xcodeProject.addTargetAttribute('DevelopmentTeam', appleTeamId);
    return cfg;
  });
}

function withMainAppGroup(config) {
  return withEntitlementsPlist(config, (cfg) => {
    const key = 'com.apple.security.application-groups';
    if (!Array.isArray(cfg.modResults[key])) {
      cfg.modResults[key] = [];
    }
    if (!cfg.modResults[key].includes(APP_GROUP)) {
      cfg.modResults[key].push(APP_GROUP);
    }
    return cfg;
  });
}

function withEasAppExtensionMeta(config) {
  const bundleIdentifier = config.ios?.bundleIdentifier || 'com.carmanapp.baires';
  const appExtensions = [
    ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions || []),
  ];

  if (!appExtensions.some((e) => e.targetName === NSE_TARGET_NAME)) {
    appExtensions.push({
      targetName: NSE_TARGET_NAME,
      bundleIdentifier: `${bundleIdentifier}.${NSE_TARGET_NAME}`,
      entitlements: {
        'com.apple.security.application-groups': [APP_GROUP],
      },
    });
  }

  config.extra = {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions,
          },
        },
      },
    },
  };
  return config;
}

function withStubNotificationServiceExtension(config, { appleTeamId } = {}) {
  config = withEasAppExtensionMeta(config);
  config = withMainAppGroup(config);
  config = withStubNseFiles(config);
  config = withStubNseXcode(config, appleTeamId || 'A33553U39B');
  return config;
}

module.exports = withStubNotificationServiceExtension;
