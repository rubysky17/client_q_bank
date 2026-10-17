import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { storage } from '@/stores/storage';

const DEVICE_ID_KEY = 'device.id';

/** Random enough for an install id (not a secret): the server keeps one session per device id. */
function newDeviceId(): string {
  const random = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random()}-${random()}`;
}

/** Stable per-install id, created on first use. */
export function getDeviceId(): string {
  let id = storage.getString(DEVICE_ID_KEY);
  if (!id) {
    id = newDeviceId();
    storage.set(DEVICE_ID_KEY, id);
  }
  return id;
}

const PLATFORMS = { ios: 'IOS', android: 'ANDROID', web: 'WEB' } as const;

/** What the API wants to know about this device when signing in. */
export function getDeviceInfo() {
  const platform = PLATFORMS[Platform.OS as keyof typeof PLATFORMS];
  return {
    deviceId: getDeviceId(),
    ...(Constants.deviceName ? { deviceName: Constants.deviceName.slice(0, 200) } : {}),
    ...(platform ? { platform } : {}),
  };
}
