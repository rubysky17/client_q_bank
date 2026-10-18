import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="exams/[id]" options={{ title: t('exam.title') }} />
      {/* The test screen sets its own title (exam name) and timer. */}
      <Stack.Screen name="attempts/[id]/index" options={{ title: t('attempt.title') }} />
      <Stack.Screen
        name="attempts/[id]/result"
        options={{ title: t('result.title'), headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="attempts/[id]/review" options={{ title: t('review.title') }} />
    </Stack>
  );
}
