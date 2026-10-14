import { View } from 'react-native';

import { useMe } from '@/api/auth';
import { Avatar, Card, Skeleton, Text } from '@/components/ui';

export function AccountCard() {
  const { data: me } = useMe();

  return (
    <Card className="flex-row items-center gap-3">
      <Avatar alt={me?.firstName ?? ''} size="lg">
        {me ? <Avatar.Image source={{ uri: me.image }} /> : null}
        <Avatar.Fallback>{me?.firstName.charAt(0) ?? ''}</Avatar.Fallback>
      </Avatar>
      {me ? (
        <View className="flex-1 gap-0.5">
          <Text weight="semibold">{`${me.firstName} ${me.lastName}`}</Text>
          <Text type="body-sm" color="muted" truncate>
            {me.email}
          </Text>
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
