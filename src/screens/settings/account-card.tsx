import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMe } from '@/api/auth';
import { Avatar, Card, Chip, Skeleton, Text } from '@/components/ui';

export function AccountCard() {
  const { t } = useTranslation();
  const { data: me } = useMe();

  return (
    <Card className="flex-row items-center gap-3">
      <Avatar alt={me?.fullName ?? ''} size="lg">
        <Avatar.Fallback>{me?.fullName.charAt(0).toUpperCase() ?? ''}</Avatar.Fallback>
      </Avatar>
      {me ? (
        <View className="flex-1 gap-1">
          <Text weight="semibold">{me.fullName}</Text>
          <Text type="body-sm" color="muted" truncate>
            {me.email}
          </Text>
          <View className="flex-row">
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>{t(`settings.role.${me.role}`)}</Chip.Label>
            </Chip>
          </View>
        </View>
      ) : (
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-48 rounded-md" />
        </View>
      )}
    </Card>
  );
}
