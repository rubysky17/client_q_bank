import { View } from 'react-native';

import { Text } from '@/components/ui';
import { VocabText } from '@/components/vocab';

type ParagraphsProps = {
  text: string;
  type?: 'body' | 'body-sm';
  weight?: 'normal' | 'medium';
  /** Turns on the vocabulary layer; each paragraph is block `${vocabId}:${index}`. */
  vocabId?: string;
};

/** Question texts keep the source's paragraphs (blank lines) and line breaks (tables, lists). */
export function Paragraphs({ text, type = 'body', weight = 'normal', vocabId }: ParagraphsProps) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <View className="gap-3">
      {paragraphs.map((paragraph, index) => (
        // Paragraphs never reorder: the index is a stable key.
        <Text key={index} type={type} weight={weight} className="leading-6">
          {vocabId === undefined ? (
            paragraph
          ) : (
            <VocabText text={paragraph} blockId={`${vocabId}:${index}`} />
          )}
        </Text>
      ))}
    </View>
  );
}
