import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Exam details and the result draw their own gradient header (BrandHero). */}
      <Stack.Screen name="exams/[id]" options={{ title: t('exam.title'), headerShown: false }} />
      {/* The test and practice screens draw their own top bar (AttemptTopBar). */}
      <Stack.Screen
        name="attempts/[id]/index"
        options={{ title: t('attempt.title'), headerShown: false }}
      />
      <Stack.Screen
        name="attempts/[id]/result"
        options={{ title: t('result.title'), headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="attempts/[id]/review" options={{ title: t('review.title') }} />
      <Stack.Screen name="practice" options={{ title: t('practice.title'), headerShown: false }} />
      {/* Account forms (Settings) draw the v2 top bar too. */}
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
      <Stack.Screen name="delete-account" options={{ headerShown: false }} />
    </Stack>
  );
}
