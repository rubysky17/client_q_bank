import { View } from 'react-native';

import type { AttemptStatus } from '@/api/attempts';
import { Card, IconTile, PressableFeedback, ProgressRing, Text, type Tone } from '@/components/ui';

/** How a row reads at a glance: in progress, passed, not passed, ended early, or no pass mark. */
export type RowOutcome = 'progress' | 'passed' | 'failed' | 'ended' | 'neutral';

type AttemptRowProps = {
  id: string;
  title: string;
  tone: Tone;
  status: AttemptStatus;
  outcome: RowOutcome;
  statusLabel: string;
  dateLabel: string;
  scoreLabel: string | null;
  percent: number | null;
  /** Answered share (0–100) of an attempt in progress. */
  progress: number;
  onPress: (id: string, status: AttemptStatus) => void;
};

// Literal class names so Tailwind generates them.
const PILL = {
  progress: { bg: 'bg-accent-soft', fg: 'text-accent-soft-foreground', dot: 'bg-accent' },
  passed: { bg: 'bg-success-soft', fg: 'text-success-soft-foreground', dot: 'bg-success' },
  failed: { bg: 'bg-danger-soft', fg: 'text-danger-soft-foreground', dot: 'bg-danger' },
  ended: { bg: 'bg-warning-soft', fg: 'text-warning-soft-foreground', dot: 'bg-warning' },
  neutral: { bg: 'bg-default', fg: 'text-default-foreground', dot: 'bg-muted' },
} as const satisfies Record<RowOutcome, { bg: string; fg: string; dot: string }>;

// List item: primitive props only, no data fetching.
export function AttemptRow({
  id,
  title,
  tone,
  status,
  outcome,
  statusLabel,
  dateLabel,
  scoreLabel,
  percent,
  progress,
  onPress,
}: AttemptRowProps) {
  const pill = PILL[outcome];

  return (
    <PressableFeedback onPress={() => onPress(id, status)} className="rounded-3xl">
      <Card className="flex-row items-center gap-3 border border-border">
        <IconTile tone={tone} icon="document-text-outline" />
        <View className="flex-1 gap-1.5">
          <Text type="body-sm" weight="semibold" numberOfLines={2}>
            {title}
          </Text>
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${pill.bg}`}>
              <View className={`size-1.5 rounded-full ${pill.dot}`} />
              <Text type="body-xs" weight="semibold" className={pill.fg}>
                {statusLabel}
              </Text>
            </View>
            <Text type="body-xs" color="muted">
              {dateLabel}
            </Text>
          </View>
        </View>
        <View className="items-end gap-0.5">
          {outcome === 'progress' ? (
            <ProgressRing percent={progress} size={36} thickness={4} />
          ) : percent === null ? null : (
            <Text type="h5" className={pill.fg}>{`${percent}%`}</Text>
          )}
          {scoreLabel ? (
            <Text type="body-xs" color="muted">
              {scoreLabel}
            </Text>
          ) : null}
        </View>
      </Card>
    </PressableFeedback>
  );
}
