import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { ReminderTime } from '@/stores/settings-store';

/** One reminder at a time: rescheduling replaces it. */
const REMINDER_ID = 'study-reminder';
const CHANNEL_ID = 'study-reminders';

/**
 * expo-notifications is a native module: an app binary built before it was added (an older dev
 * client) doesn't have it, and importing the package there throws. Check first, then load it lazily.
 */
export const areRemindersAvailable =
  Platform.OS !== 'web' && requireOptionalNativeModule('ExpoNotificationScheduler') !== null;

type NotificationsModule = typeof import('expo-notifications');

function notifications(): NotificationsModule | null {
  if (!areRemindersAvailable) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: see areRemindersAvailable
  return require('expo-notifications') as NotificationsModule;
}

/** Shows reminders even while the app is open. Called once by the app providers. */
export function configureNotifications() {
  notifications()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

type ReminderContent = { title: string; body: string; channelName: string };

/**
 * Schedules the daily study reminder at `time` (local), asking for permission when needed.
 * Returns false without permission (or without the native module).
 */
export async function scheduleStudyReminder(
  time: ReminderTime,
  content: ReminderContent,
): Promise<boolean> {
  const Notifications = notifications();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  const granted =
    current.granted ||
    (current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: content.channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await cancelStudyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: content.title, body: content.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}

export async function cancelStudyReminder() {
  await notifications()
    ?.cancelScheduledNotificationAsync(REMINDER_ID)
    .catch(() => undefined);
}

/**
 * Follows a reminder changed on another device: schedules it only if this device already allows
 * notifications (never asks out of the blue), or cancels it.
 */
export async function followStudyReminder(
  reminder: ReminderTime & { enabled: boolean },
  content: ReminderContent,
) {
  const Notifications = notifications();
  if (!Notifications) return;
  if (!reminder.enabled) {
    await cancelStudyReminder();
    return;
  }
  const { granted } = await Notifications.getPermissionsAsync();
  if (granted) await scheduleStudyReminder(reminder, content);
}
