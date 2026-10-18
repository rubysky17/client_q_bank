import { View } from 'react-native';

import type { AttemptStatus } from '@/api/attempts';
import { Card, Chip, PressableFeedback, Text } from '@/components/ui';

type AttemptRowProps = {
  id: string;
  title: string;
  status: AttemptStatus;
  statusLabel: string;
  dateLabel: string;
  scoreLabel: string | null;
  percent: number | null;
  passed: boolean | null;
  onPress: (id: string, status: AttemptStatus) => void;
};

const STATUS_COLOR = {
  IN_PROGRESS: 'accent',
  SUBMITTED: 'default',
  EXPIRED: 'warning',
  ABANDONED: 'warning',
} as const satisfies Record<AttemptStatus, 'accent' | 'default' | 'warning'>;

// List item: primitive props only, no data fetching.
export function AttemptRow({
  id,
  title,
  status,
  statusLabel,
  dateLabel,
  scoreLabel,
  percent,
  passed,
  onPress,
}: AttemptRowProps) {
  return (
    <PressableFeedback onPress={() => onPress(id, status)} className="rounded-3xl">
      <Card className="flex-row items-center gap-3">
        <View className="flex-1 gap-1">
          <Text weight="semibold" numberOfLines={2}>
            {title}
          </Text>
          <Text type="body-xs" color="muted">
            {dateLabel}
          </Text>
          <View className="flex-row items-center gap-2 pt-1">
            <Chip size="sm" variant="soft" color={STATUS_COLOR[status]}>
              <Chip.Label>{statusLabel}</Chip.Label>
            </Chip>
            {scoreLabel ? (
              <Text type="body-xs" color="muted">
                {scoreLabel}
              </Text>
            ) : null}
          </View>
        </View>
        {percent === null ? null : (
          <Text
            type="h4"
            className={
              passed === null ? 'text-foreground' : passed ? 'text-success' : 'text-danger'
            }
          >
            {`${percent}%`}
          </Text>
        )}
      </Card>
    </PressableFeedback>
  );
}
