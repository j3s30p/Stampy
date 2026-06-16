import { View } from 'react-native';
import { AppText } from '@shared/ui';
import { styles } from './HomeView.styles';

export function SectionHead({
  title,
  action,
}: {
  readonly title: string;
  readonly action: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <AppText variant="h3" tone="ink" numberOfLines={1}>
        {title}
      </AppText>
      <AppText variant="caption" tone="inkMuted" numberOfLines={1}>
        {action}
      </AppText>
    </View>
  );
}
