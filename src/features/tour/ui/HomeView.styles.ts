import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@shared/ui';

const homePalette = {
  progressSub: '#AAB6C6',
  eventBorder: '#BFD6FF',
  spotMarkFallback: '#F0E6D6',
} as const;

const fallbackThumbnailPalette = {
  hill: '#7FA86E',
  roof: '#3E5C46',
  wall: '#B4543A',
} as const;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  greeting: {
    lineHeight: 28,
  },
  progressCard: {
    padding: spacing.lg,
    borderRadius: 18,
    gap: spacing.sm,
    backgroundColor: colors.ink,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressSub: {
    color: homePalette.progressSub,
  },
  progressAction: {
    color: colors.brandLight,
  },
  progressFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  readyCard: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.stamp,
  },
  readyStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.stamp,
  },
  readyStateText: {
    color: colors.stampInk,
  },
  readyList: {
    gap: spacing.xs,
  },
  readyRowPressable: {
    minWidth: 0,
  },
  readyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  readyText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  readyKindText: {
    color: colors.stampInk,
  },
  readyDistance: {
    color: colors.stampInk,
  },
  contentSwitcher: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentButton: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.ink,
  },
  segmentLabel: {
    flexShrink: 1,
  },
  segmentCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: colors.surfaceSink,
  },
  segmentCountActive: {
    backgroundColor: colors.surface,
  },
  spotList: {
    gap: spacing.xs,
  },
  eventList: {
    gap: spacing.xs,
  },
  spotPressable: {
    minWidth: 0,
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: homePalette.eventBorder,
  },
  eventMark: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.locationDot,
  },
  eventMarkImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePill: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 34, 51, 0.72)',
  },
  eventMarkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  spotMark: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSink,
  },
  spotMarkImage: {
    width: '100%',
    height: '100%',
  },
  spotMarkFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homePalette.spotMarkFallback,
  },
  spotMarkFallbackDone: {
    backgroundColor: colors.stampSoft,
  },
  spotCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  spotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spotTitle: {
    flex: 1,
    minWidth: 0,
  },
  spotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  placeThumb: {
    flex: 0,
    overflow: 'hidden',
    backgroundColor: colors.skySoft,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbSky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.skySoft,
  },
  thumbHill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: fallbackThumbnailPalette.hill,
  },
  thumbRoof: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: '34%',
    height: '18%',
    backgroundColor: fallbackThumbnailPalette.roof,
    transform: [{ rotate: '45deg' }],
  },
  thumbWall: {
    position: 'absolute',
    left: '28%',
    right: '28%',
    bottom: '18%',
    height: '22%',
    backgroundColor: fallbackThumbnailPalette.wall,
  },
  sectionHead: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recentPressable: {
    flex: 1,
    minWidth: 0,
  },
  recentCard: {
    minHeight: 114,
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stampMedallion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampDone: {
    borderWidth: 2,
    borderColor: colors.stamp,
    backgroundColor: colors.stampSoft,
  },
  stampLocked: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceSink,
  },
  stampDoneText: {
    color: colors.stampInk,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});
