import type { Dispatch, SetStateAction } from 'react';
import type { GestureResponderHandlers } from 'react-native';
import { Pressable, View } from 'react-native';
import { mapSheetStyles as styles } from './MapSheet.styles';

interface MapSheetGrabberProps {
  readonly setSheetExpanded: Dispatch<SetStateAction<boolean>>;
  readonly sheetExpanded: boolean;
  readonly sheetPanHandlers: GestureResponderHandlers;
}

export function MapSheetGrabber({
  setSheetExpanded,
  sheetExpanded,
  sheetPanHandlers,
}: MapSheetGrabberProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sheetExpanded ? '지도 시트 접기' : '지도 시트 펼치기'}
      accessibilityState={{ expanded: sheetExpanded }}
      onPress={() => setSheetExpanded((expanded) => !expanded)}
      style={styles.sheetGrabberTouch}
      {...sheetPanHandlers}
    >
      <View style={styles.sheetGrabber} />
    </Pressable>
  );
}
