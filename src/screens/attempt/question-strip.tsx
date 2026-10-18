import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { PressableFeedback, Text } from '@/components/ui';

export type StripItem = { id: string; isAnswered: boolean; isFlagged: boolean };

type QuestionStripProps = {
  items: StripItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
};

/** Horizontal row of question numbers: answered ones are filled, flagged ones get a warning ring. */
export function QuestionStrip({ items, currentIndex, onSelect }: QuestionStripProps) {
  const listRef = useRef<FlashListRef<StripItem>>(null);

  useEffect(() => {
    void listRef.current?.scrollToIndex({ index: currentIndex, animated: true, viewPosition: 0.5 });
  }, [currentIndex]);

  return (
    <FlashList
      ref={listRef}
      horizontal
      data={items}
      extraData={currentIndex}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <StripCell
          index={index}
          isCurrent={index === currentIndex}
          isAnswered={item.isAnswered}
          isFlagged={item.isFlagged}
          onSelect={onSelect}
        />
      )}
      ItemSeparatorComponent={Gap}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
    />
  );
}

type StripCellProps = {
  index: number;
  isCurrent: boolean;
  isAnswered: boolean;
  isFlagged: boolean;
  onSelect: (index: number) => void;
};

function StripCell({ index, isCurrent, isAnswered, isFlagged, onSelect }: StripCellProps) {
  const background = isCurrent
    ? 'bg-accent'
    : isAnswered
      ? 'bg-accent-soft'
      : 'bg-surface-secondary';
  const ring = isFlagged ? 'border-2 border-warning' : 'border-2 border-transparent';
  const text = isCurrent
    ? 'text-accent-foreground'
    : isAnswered
      ? 'text-accent-soft-foreground'
      : 'text-muted';

  return (
    <PressableFeedback
      onPress={() => onSelect(index)}
      className={`size-10 items-center justify-center rounded-full ${background} ${ring}`}
    >
      <Text type="body-sm" weight="semibold" className={text}>
        {index + 1}
      </Text>
    </PressableFeedback>
  );
}

function Gap() {
  return <View className="w-2" />;
}
