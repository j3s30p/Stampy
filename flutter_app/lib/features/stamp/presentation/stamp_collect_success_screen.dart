import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:stampy/app/theme/app_colors.dart';

import '../domain/stamp.dart';

const _collectionGoal = 24;

class StampCollectSuccessScreen extends StatefulWidget {
  const StampCollectSuccessScreen({
    required this.stamp,
    required this.collectedCount,
    required this.onViewCollection,
    required this.onContinueTravel,
    super.key,
  }) : assert(collectedCount >= 0);

  final CollectedStamp stamp;
  final int collectedCount;
  final VoidCallback onViewCollection;
  final VoidCallback onContinueTravel;

  @override
  State<StampCollectSuccessScreen> createState() =>
      _StampCollectSuccessScreenState();
}

class _StampCollectSuccessScreenState extends State<StampCollectSuccessScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _stampController;
  late final Animation<double> _stampScale;
  late final Animation<double> _stampOpacity;

  @override
  void initState() {
    super.initState();
    _stampController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 620),
    );
    _stampScale = Tween<double>(begin: 1.7, end: 1).animate(
      CurvedAnimation(parent: _stampController, curve: Curves.easeOutBack),
    );
    _stampOpacity = CurvedAnimation(
      parent: _stampController,
      curve: const Interval(0, 0.48, curve: Curves.easeOut),
    );
    _stampController.forward();
  }

  @override
  void dispose() {
    _stampController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final date = DateFormat(
      'yyyy.MM.dd',
    ).format(widget.stamp.collectedAt.toLocal());

    return Scaffold(
      backgroundColor: StampyColors.canvas,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 36),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 60,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _StampPaper(
                          stamp: widget.stamp,
                          date: date,
                          stampScale: _stampScale,
                          stampOpacity: _stampOpacity,
                        ),
                        const SizedBox(height: 38),
                        _JournalProgress(collectedCount: widget.collectedCount),
                        const SizedBox(height: 40),
                        _JournalActionButton(
                          label: '도장 컬렉션 보기',
                          icon: Icons.auto_stories_outlined,
                          isPrimary: true,
                          onPressed: widget.onViewCollection,
                        ),
                        const SizedBox(height: 14),
                        _JournalActionButton(
                          label: '여행 계속하기',
                          icon: Icons.arrow_forward,
                          onPressed: widget.onContinueTravel,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _StampPaper extends StatelessWidget {
  const _StampPaper({
    required this.stamp,
    required this.date,
    required this.stampScale,
    required this.stampOpacity,
  });

  final CollectedStamp stamp;
  final String date;
  final Animation<double> stampScale;
  final Animation<double> stampOpacity;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: StampyColors.paper,
        border: Border.all(color: StampyColors.paleAccent),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 28, 22, 26),
        child: Column(
          children: [
            FadeTransition(
              opacity: stampOpacity,
              child: ScaleTransition(
                key: const Key('vermilion-stamp-animation'),
                scale: stampScale,
                child: const _VermilionStamp(),
              ),
            ),
            const SizedBox(height: 18),
            Transform.rotate(
              angle: 0.025,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: StampyColors.paper.withValues(alpha: 0.92),
                  border: Border.all(color: StampyColors.paleAccent),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _formatCoordinates(stamp),
                        maxLines: 2,
                        overflow: TextOverflow.visible,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(
                              color: StampyColors.accent,
                              letterSpacing: 0.5,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatVerification(stamp),
                        maxLines: 2,
                        overflow: TextOverflow.visible,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: StampyColors.mutedInk,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 5),
            Transform.rotate(
              angle: 0.025,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: StampyColors.paper.withValues(alpha: 0.92),
                  border: Border.all(color: StampyColors.hairline),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  child: Text(
                    'KOREA · $date',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: StampyColors.mutedInk,
                      letterSpacing: 0.7,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              stamp.title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 7),
            Text(
              '${stamp.title} 도장을 수집했어요',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: StampyColors.mutedInk),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatCoordinates(CollectedStamp stamp) {
  final latitude = stamp.location.latitude.value;
  final longitude = stamp.location.longitude.value;
  return '${latitude.abs().toStringAsFixed(4)}° ${latitude < 0 ? 'S' : 'N'}'
      ' · '
      '${longitude.abs().toStringAsFixed(4)}° ${longitude < 0 ? 'W' : 'E'}';
}

String _formatVerification(CollectedStamp stamp) {
  final accuracy = stamp.verificationFix.accuracyMeters;
  final accuracyLabel = accuracy == accuracy.roundToDouble()
      ? accuracy.toStringAsFixed(0)
      : accuracy.toStringAsFixed(1);
  final measuredAt = DateFormat(
    'HH:mm:ss',
  ).format(stamp.verificationFix.timestamp.toUtc());
  return 'GPS ±${accuracyLabel}m · $measuredAt UTC';
}

class _VermilionStamp extends StatelessWidget {
  const _VermilionStamp();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '도장 수집 완료',
      image: true,
      child: Transform.rotate(
        angle: 0.045,
        child: SizedBox.square(
          dimension: 176,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: StampyColors.accent, width: 5),
                ),
              ),
              Container(
                width: 158,
                height: 158,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: StampyColors.accent.withValues(alpha: 0.34),
                    width: 1.5,
                  ),
                ),
              ),
              const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    color: StampyColors.accent,
                    size: 72,
                  ),
                  Text(
                    'STAMPY',
                    textScaler: TextScaler.noScaling,
                    style: TextStyle(
                      color: StampyColors.accent,
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _JournalProgress extends StatelessWidget {
  const _JournalProgress({required this.collectedCount});

  final int collectedCount;

  @override
  Widget build(BuildContext context) {
    final progress = (collectedCount / _collectionGoal).clamp(0.0, 1.0);

    return Semantics(
      label: '여행 기록 진행도 $collectedCount / $_collectionGoal',
      value: '${(progress * 100).round()}%',
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'JOURNAL PROGRESS',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: StampyColors.mutedInk,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '$collectedCount / $_collectionGoal',
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: StampyColors.accent),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 12,
              child: Stack(
                alignment: Alignment.centerLeft,
                children: [
                  const SizedBox(
                    width: double.infinity,
                    child: Divider(
                      color: StampyColors.paleAccent,
                      thickness: 2,
                    ),
                  ),
                  FractionallySizedBox(
                    widthFactor: progress,
                    child: const SizedBox(
                      width: double.infinity,
                      child: Divider(color: StampyColors.accent, thickness: 2),
                    ),
                  ),
                  Align(
                    alignment: Alignment(progress * 2 - 1, 0),
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: StampyColors.accent,
                        shape: BoxShape.circle,
                        border: Border.all(color: StampyColors.paper, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'ENTRY_01',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(
                      context,
                    ).textTheme.labelMedium?.copyWith(fontSize: 9),
                  ),
                ),
                Expanded(
                  child: Text(
                    'GOAL_24',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end,
                    style: Theme.of(
                      context,
                    ).textTheme.labelMedium?.copyWith(fontSize: 9),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _JournalActionButton extends StatefulWidget {
  const _JournalActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isPrimary = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final bool isPrimary;

  @override
  State<_JournalActionButton> createState() => _JournalActionButtonState();
}

class _JournalActionButtonState extends State<_JournalActionButton> {
  var _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final foreground = widget.isPrimary ? StampyColors.paper : StampyColors.ink;
    final background = widget.isPrimary
        ? StampyColors.accent
        : StampyColors.paper.withValues(alpha: 0.32);
    final radius = BorderRadius.circular(14);

    return Semantics(
      button: true,
      label: widget.label,
      onTap: widget.onPressed,
      child: ExcludeSemantics(
        child: AnimatedScale(
          key: ValueKey('${widget.label}-press-animation'),
          scale: _isPressed ? 0.97 : 1,
          duration: const Duration(milliseconds: 110),
          curve: Curves.easeOut,
          child: Material(
            color: background,
            shape: RoundedRectangleBorder(
              borderRadius: radius,
              side: BorderSide(
                color: widget.isPrimary
                    ? StampyColors.accent
                    : StampyColors.mutedInk,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: widget.onPressed,
              onHighlightChanged: (value) {
                if (_isPressed != value) {
                  setState(() => _isPressed = value);
                }
              },
              splashColor: widget.isPrimary
                  ? StampyColors.paper.withValues(alpha: 0.2)
                  : StampyColors.paleAccent,
              highlightColor: Colors.transparent,
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 56),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (widget.isPrimary) ...[
                        Icon(widget.icon, color: foreground, size: 22),
                        const SizedBox(width: 9),
                      ],
                      Flexible(
                        child: Text(
                          widget.label,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(color: foreground, fontSize: 16),
                        ),
                      ),
                      if (!widget.isPrimary) ...[
                        const SizedBox(width: 9),
                        Icon(widget.icon, color: foreground, size: 22),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
