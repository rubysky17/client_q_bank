import type { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ActionBar, IconTile, type IconName, Text, type Tone } from '@/components/ui';
import { AttemptTopBar } from '@/screens/attempt/attempt-top-bar';

type AccountFormProps = {
  title: string;
  icon: IconName;
  tone: Tone;
  intro: string;
  children: ReactNode;
  /** The submit button(s), in the bottom action bar. */
  actions: ReactNode;
};

/** Layout shared by the account forms: v2 top bar, an intro card, the fields, actions at the bottom. */
export function AccountForm({ title, icon, tone, intro, children, actions }: AccountFormProps) {
  return (
    <View className="flex-1">
      <AttemptTopBar title={title} />
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-5 px-4 pt-2 pb-6"
      >
        <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-surface p-4">
          <IconTile tone={tone} icon={icon} />
          <Text type="body-sm" color="muted" className="flex-1">
            {intro}
          </Text>
        </View>
        {children}
      </KeyboardAwareScrollView>
      <ActionBar>{actions}</ActionBar>
    </View>
  );
}
