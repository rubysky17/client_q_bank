import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet, Button, Chip, Text } from '@/components/ui';
import { MeaningForm, meaningStatus, PendingMeaning, useIsOnline } from '@/components/vocab';
import { retryVocabTranslation, useVocabEntry, useVocabSyncIssue } from '@/stores/vocab-store';
import { buildMatcher, segment } from '@/vocab/matcher';

type VocabDetailSheetProps = {
  /** The note shown; kept while the sheet closes so its content does not vanish. */
  entryKey: string | null;
  /** Bumped on every opening: the sheet starts again on the meaning, not in edit mode. */
  openCount: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDelete: (key: string) => void;
};

/** One note in full: meaning (editable), explanation, context sentence, source and date. */
export function VocabDetailSheet({
  entryKey,
  openCount,
  isOpen,
  onOpenChange,
  onDelete,
}: VocabDetailSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content keyboardBehavior="interactive">
          {entryKey ? (
            <DetailBody
              key={`${entryKey}:${openCount}`}
              entryKey={entryKey}
              onDelete={(key) => {
                onOpenChange(false);
                onDelete(key);
              }}
            />
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

type DetailBodyProps = {
  entryKey: string;
  onDelete: (key: string) => void;
};

function DetailBody({ entryKey, onDelete }: DetailBodyProps) {
  const { t, i18n } = useTranslation();
  const entry = useVocabEntry(entryKey);
  const isOnline = useIsOnline();
  const syncIssue = useVocabSyncIssue();
  const [isEditing, setIsEditing] = useState(false);
  if (!entry) return null;

  const status = meaningStatus(entry, isOnline, syncIssue);
  const notedOn = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
    new Date(entry.createdAt),
  );
  // The term in bold inside its sentence (whole words, any case).
  const context = entry.context ? segment(entry.context, buildMatcher([entry.key])) : null;

  return (
    <View className="gap-5 pb-2">
      <View className="gap-2">
        <BottomSheet.Title className="text-2xl">{entry.term}</BottomSheet.Title>
        <View className="flex-row flex-wrap gap-2">
          <Chip size="sm" variant="soft" color={entry.kind === 'WORD' ? 'accent' : 'default'}>
            <Chip.Label>{t(`vocab.kind.${entry.kind}`)}</Chip.Label>
          </Chip>
          {entry.partOfSpeech ? (
            <Chip size="sm" variant="soft" color="default">
              <Chip.Label>{entry.partOfSpeech}</Chip.Label>
            </Chip>
          ) : null}
        </View>
      </View>

      {isEditing ? (
        <MeaningForm entryKey={entry.key} onDone={() => setIsEditing(false)} autoFocus />
      ) : (
        <Section title={t('vocab.meaning')}>
          {entry.meaning !== null ? (
            <Text type="h5" className="text-accent">
              {entry.meaning}
            </Text>
          ) : status === 'ready' ? null : (
            <PendingMeaning status={status} onRetry={() => retryVocabTranslation(entry.key)} />
          )}
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            onPress={() => setIsEditing(true)}
          >
            <Button.Label>
              {entry.meaning === null ? t('vocab.addMeaning') : t('vocab.editMeaning')}
            </Button.Label>
          </Button>
        </Section>
      )}

      {entry.explanation ? (
        <Section title={t('vocab.explanation')}>
          <Text type="body-sm">{entry.explanation}</Text>
        </Section>
      ) : null}

      {context ? (
        <Section title={t('vocab.context')}>
          <Text type="body-sm" color="muted" className="leading-5">
            {context.map((part) =>
              part.key === undefined ? (
                part.text
              ) : (
                <Text key={part.start} type="body-sm" weight="semibold">
                  {part.text}
                </Text>
              ),
            )}
          </Text>
        </Section>
      ) : null}

      <View className="gap-1">
        {entry.sourceTitle ? (
          <Text type="body-xs" color="muted">
            {`${t('vocab.source')}: ${entry.sourceTitle}`}
          </Text>
        ) : null}
        <Text type="body-xs" color="muted">
          {t('vocab.notedOn', { date: notedOn })}
        </Text>
      </View>

      <Button variant="danger-soft" onPress={() => onDelete(entry.key)}>
        <Button.Label>{t('vocab.delete')}</Button.Label>
      </Button>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text type="body-xs" weight="semibold" color="muted" className="tracking-wide uppercase">
        {title}
      </Text>
      {children}
    </View>
  );
}
