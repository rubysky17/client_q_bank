import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip, IconButton, PressableFeedback, Text } from '@/components/ui';
import { type MeaningStatus, PendingMeaning } from '@/components/vocab';
import type { TermKind } from '@/vocab/term';

type VocabRowProps = {
  entryKey: string;
  term: string;
  kind: TermKind;
  partOfSpeech: string | null;
  meaning: string | null;
  status: MeaningStatus;
  context: string | null;
  onPress: (key: string) => void;
  onDelete: (key: string) => void;
  onRetry: (key: string) => void;
};

// List item: primitive props only, no data fetching.
export function VocabRow({
  entryKey,
  term,
  kind,
  partOfSpeech,
  meaning,
  status,
  context,
  onPress,
  onDelete,
  onRetry,
}: VocabRowProps) {
  const { t } = useTranslation();

  return (
    <PressableFeedback
      onPress={() => onPress(entryKey)}
      accessibilityRole="button"
      className="flex-row items-start gap-3 rounded-3xl border border-border bg-surface py-3 pr-2 pl-4"
    >
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text weight="semibold" className="shrink" numberOfLines={2}>
            {term}
          </Text>
          <Chip size="sm" variant="soft" color={kind === 'WORD' ? 'accent' : 'default'}>
            <Chip.Label>{partOfSpeech ?? t(`vocab.kind.${kind}`)}</Chip.Label>
          </Chip>
        </View>
        {meaning !== null ? (
          <Text type="body-sm" className="text-accent" numberOfLines={2}>
            {meaning}
          </Text>
        ) : status === 'ready' ? null : (
          <PendingMeaning status={status} onRetry={() => onRetry(entryKey)} />
        )}
        {context ? (
          <Text type="body-xs" color="muted" numberOfLines={1}>
            {context}
          </Text>
        ) : null}
      </View>
      <IconButton
        icon="trash-outline"
        size={36}
        onPress={() => onDelete(entryKey)}
        accessibilityLabel={`${t('vocab.delete')} “${term}”`}
        className="border-transparent bg-transparent"
      />
    </PressableFeedback>
  );
}
