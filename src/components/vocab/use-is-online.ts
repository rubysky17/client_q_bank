import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const getSnapshot = () => onlineManager.isOnline();

/** Whether the device is online (TanStack's online manager, fed by expo-network). */
export const useIsOnline = () => useSyncExternalStore(subscribe, getSnapshot);
