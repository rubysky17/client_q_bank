import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { QuestionMedia as Media } from '@/api/attempts';
import { PressableFeedback, Text, useThemeColor } from '@/components/ui';
import { env } from '@/lib/env';

/** Images are served next to the API (`/media/...`), not under `/api/v1`. */
const API_ORIGIN = /^https?:\/\/[^/]+/.exec(env.EXPO_PUBLIC_API_URL)?.[0] ?? '';

export const mediaUri = (url: string) => (url.startsWith('/') ? `${API_ORIGIN}${url}` : url);

type QuestionMediaProps = {
  media: readonly Media[];
};

/** Charts and tables of a question, full width; tap one to zoom. */
export function QuestionMedia({ media }: QuestionMediaProps) {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState<Media | null>(null);
  const muted = useThemeColor('muted');

  if (media.length === 0) return null;

  return (
    <View className="gap-3">
      {media.map((item) => (
        <PressableFeedback
          key={item.url}
          onPress={() => setZoomed(item)}
          accessibilityRole="imagebutton"
          accessibilityLabel={item.alt}
          accessibilityHint={t('question.zoomHint')}
          className="gap-1"
        >
          <Image
            source={{ uri: mediaUri(item.url) }}
            alt={item.alt}
            contentFit="contain"
            transition={150}
            style={{ width: '100%', aspectRatio: item.width / item.height }}
            className="rounded-xl"
          />
          <View className="flex-row items-center gap-1 self-end">
            <Ionicons name="expand-outline" size={12} color={muted} />
            <Text type="body-xs" color="muted">
              {t('question.zoomHint')}
            </Text>
          </View>
        </PressableFeedback>
      ))}
      <ImageViewer media={zoomed} onClose={() => setZoomed(null)} />
    </View>
  );
}

const MAX_SCALE = 5;

/** Full-screen viewer: pinch to zoom, drag to pan, double tap to zoom in/out. */
function ImageViewer({ media, onClose }: { media: Media | null; onClose: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor('foreground');
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const reset = () => {
    scale.set(withTiming(1));
    savedScale.set(1);
    x.set(withTiming(0));
    y.set(withTiming(0));
    savedX.set(0);
    savedY.set(0);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.set(Math.min(MAX_SCALE, Math.max(1, savedScale.get() * event.scale)));
    })
    .onEnd(() => {
      savedScale.set(scale.get());
    });
  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((event) => {
      x.set(savedX.get() + event.translationX);
      y.set(savedY.get() + event.translationY);
    })
    .onEnd(() => {
      savedX.set(x.get());
      savedY.set(y.get());
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.get() > 1 ? 1 : 2.5;
      scale.set(withTiming(next));
      savedScale.set(next);
      if (next === 1) {
        x.set(withTiming(0));
        y.set(withTiming(0));
        savedX.set(0);
        savedY.set(0);
      }
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={media !== null}
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      {/* Gestures inside a Modal need their own root on Android. */}
      <GestureHandlerRootView style={styles.fill}>
        <View className="flex-1 bg-background">
          <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
            <Animated.View style={[styles.fill, imageStyle]}>
              {media ? (
                <Image
                  source={{ uri: mediaUri(media.url) }}
                  alt={media.alt}
                  contentFit="contain"
                  style={styles.fill}
                />
              ) : null}
            </Animated.View>
          </GestureDetector>
          <PressableFeedback
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t('question.close')}
            className="absolute right-4 size-11 items-center justify-center rounded-full bg-surface"
            style={{ top: insets.top + 8 }}
          >
            <Ionicons name="close" size={24} color={foreground} />
          </PressableFeedback>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
