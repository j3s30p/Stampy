import 'package:flutter/material.dart';
import 'package:stampy/app/theme/app_colors.dart';

class FieldJournalPage extends StatelessWidget {
  const FieldJournalPage({
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.children,
    this.trailing,
    super.key,
  });

  final String eyebrow;
  final String title;
  final String description;
  final List<Widget> children;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
        children: [
          _JournalUtilityBar(trailing: trailing),
          const SizedBox(height: 34),
          Text(
            eyebrow.toUpperCase(),
            style: Theme.of(context).textTheme.labelMedium,
          ),
          const SizedBox(height: 10),
          Text(title, style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 12),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 330),
            child: Text(
              description,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: StampyColors.mutedInk),
            ),
          ),
          const SizedBox(height: 36),
          ...children,
        ],
      ),
    );
  }
}

class JournalSection extends StatelessWidget {
  const JournalSection({
    required this.index,
    required this.title,
    required this.child,
    this.trailing,
    super.key,
  });

  final String index;
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 40,
                child: Text(
                  index,
                  style: Theme.of(
                    context,
                  ).textTheme.labelMedium?.copyWith(color: StampyColors.accent),
                ),
              ),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              if (trailing != null) ...[const SizedBox(width: 12), trailing!],
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}

class JournalBadge extends StatelessWidget {
  const JournalBadge({required this.label, this.emphasized = false, super.key});

  final String label;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: emphasized ? StampyColors.paleAccent : StampyColors.paper,
        border: Border.all(
          color: emphasized ? StampyColors.accent : StampyColors.hairline,
        ),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: emphasized ? StampyColors.accent : StampyColors.mutedInk,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}

class JournalStat extends StatelessWidget {
  const JournalStat({
    required this.value,
    required this.label,
    this.suffix,
    super.key,
  });

  final String value;
  final String label;
  final String? suffix;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(value, style: Theme.of(context).textTheme.headlineMedium),
            if (suffix != null) ...[
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(
                  suffix!,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class JournalNotice extends StatelessWidget {
  const JournalNotice({
    required this.number,
    required this.title,
    required this.description,
    this.badge,
    this.onTap,
    super.key,
  });

  final String number;
  final String title;
  final String description;
  final String? badge;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(16);
    final content = Padding(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            number,
            style: Theme.of(
              context,
            ).textTheme.labelMedium?.copyWith(color: StampyColors.accent),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (badge != null) ...[
                  JournalBadge(label: badge!, emphasized: true),
                  const SizedBox(height: 12),
                ],
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(description, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );

    final handleTap = onTap;
    if (handleTap == null) {
      return DecoratedBox(
        decoration: BoxDecoration(
          color: StampyColors.paper,
          border: Border.all(color: StampyColors.hairline),
          borderRadius: borderRadius,
        ),
        child: content,
      );
    }

    return Semantics(
      button: true,
      child: Material(
        color: StampyColors.paper,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: StampyColors.hairline),
          borderRadius: borderRadius,
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(onTap: handleTap, child: content),
      ),
    );
  }
}

class _JournalUtilityBar extends StatelessWidget {
  const _JournalUtilityBar({this.trailing});

  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final useStackedLayout =
        MediaQuery.sizeOf(context).width < 360 ||
        MediaQuery.textScalerOf(context).scale(1) > 1.3;

    return Column(
      children: [
        if (useStackedLayout)
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'STAMPY / TRAVEL ARCHIVE',
                style: Theme.of(
                  context,
                ).textTheme.labelMedium?.copyWith(color: StampyColors.ink),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child:
                    trailing ??
                    Text(
                      'KR · 2026',
                      style: Theme.of(context).textTheme.labelMedium,
                    ),
              ),
            ],
          )
        else
          Row(
            children: [
              Expanded(
                child: Text(
                  'STAMPY / TRAVEL ARCHIVE',
                  style: Theme.of(
                    context,
                  ).textTheme.labelMedium?.copyWith(color: StampyColors.ink),
                ),
              ),
              const SizedBox(width: 12),
              trailing ??
                  Text(
                    'KR · 2026',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
            ],
          ),
        const SizedBox(height: 12),
        const Divider(),
      ],
    );
  }
}
